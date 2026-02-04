import React, { useEffect, useRef } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { useEditor } from "@/providers/EditorProvider";

interface TerminalInstanceProps {
  isActive: boolean;
  onClose?: () => void;
  sessionId: string;
}

export const TerminalInstance: React.FC<TerminalInstanceProps> = ({
  isActive,
  onClose,
  sessionId,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBuffer = useRef<string>("");
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const currentInput = useRef<string>(""); // Tracks what is currently on the prompt line
  const { workspace } = useEditor();

  // Re-run fit when active changes
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
      });
    }
  }, [isActive]);

  const clear = () => {
    xtermRef.current?.clear();
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new XTerminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
      },
      allowProposedApi: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/terminal/ws?cwd=${encodeURIComponent(workspace)}&sessionId=${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // term.write("\r\nConnected to terminal\r\n");
      fitAddon.fit();
    };

    ws.onmessage = (event) => {
      // Check for clear screen sequences
      if (
        event.data.includes("\x1b[2J") ||
        event.data.includes("\x1b[3J") ||
        event.data.includes("\x1b[H") ||
        event.data.includes("\x1bc")
      ) {
        // If the backend sends a clear signal, we force a clear on frontend too
        term.clear();
      }
      term.write(event.data);
    };

    ws.onclose = () => {
      term.write("\r\nTerminal connection closed\r\n");
    };

    ws.onerror = (error) => {
      term.write(`\r\nWebSocket error: ${error}\r\n`);
    };

    // Send input to server logic with History Handling
    term.onData((data) => {
      // Handle Arrow Up/Down locally for history
      if (data === "\x1b[A") {
        // Up Arrow
        if (history.current.length > 0) {
          const newIndex = Math.min(
            historyIndex.current + 1,
            history.current.length - 1,
          );
          if (newIndex !== historyIndex.current) {
            historyIndex.current = newIndex;

            // Calculate how many chars to clear
            const clearLen = currentInput.current.length;

            // 1. Clear current line on terminal (Local action)
            // Send backspace + space + backspace sequence
            const backspaceSeq = "\b \b".repeat(clearLen);
            term.write(backspaceSeq);

            // 2. Write new history item (Local Echo)
            // We access from end: index 0 is most recent? No, usually push/pop.
            // Let's assume push: [oldest, ..., newest] -> index 0 is oldest.
            // We want newest first when going Up.
            // Let's index from end: history[length - 1 - index]
            const historyItem =
              history.current[
                history.current.length - 1 - historyIndex.current
              ] || "";
            term.write(historyItem);

            // 3. Update buffer
            currentInput.current = historyItem;
          }
        }
        return; // Don't send arrow to backend
      } else if (data === "\x1b[B") {
        // Down Arrow
        if (historyIndex.current > -1) {
          const newIndex = historyIndex.current - 1;
          historyIndex.current = newIndex;

          // Clear current
          const clearLen = currentInput.current.length;
          term.write("\b \b".repeat(clearLen));

          if (newIndex === -1) {
            // Back to empty/new draft
            currentInput.current = "";
          } else {
            const historyItem =
              history.current[history.current.length - 1 - newIndex] || "";
            term.write(historyItem);
            currentInput.current = historyItem;
          }
        }
        return; // Don't send arrow to backend
      }

      // Normal processing
      if (ws.readyState === WebSocket.OPEN) {
        // Track Input for History persistence
        if (data === "\r") {
          // Enter
          const cmd = currentInput.current.trim();
          if (cmd.length > 0) {
            // Avoid duplicates if same as last
            const last = history.current[history.current.length - 1];
            if (last !== cmd) {
              history.current.push(cmd);
            }
          }

          // IMPORTANT: If we are sending a history command that we locally echoed,
          // we technically have 'double characters' issue if backend echoes it back.
          // Strategy: Clear the local line BEFORE sending to backend,
          // relying on backend echo to restore it.
          // This prevents "double command" visual bug.

          // If we are manipulating history (index > -1), we definitely painted locally.
          // If we just typed normally (index == -1), we relied on backend echo (so we didn't paint locally),
          // except we tracked it in 'currentInput'.

          // Wait! Logic check:
          // If I type 'a', I sent 'a' to backend. Backend echoed 'a'. I added 'a' to currentInput.
          // Terminal shows 'a'.
          // Now I press Enter. I send '\r'. Backend echoes '\r\n'. Terminal moves.
          // Result: OK.

          // If I use Up Arrow:
          // I cleared line. painted 'ls'. Terminal shows 'ls'.
          // Now I press Enter.
          // If I just send '\r', backend thinks I pressed Enter on... what?
          // Backend BUFFER is empty! I never sent 'ls' to backend! I only painted it locally.
          // !!! CRITICAL: I must send the CONTENT + \r if I substituted it locally.

          if (historyIndex.current !== -1) {
            // We are in "History Mode" - backend knows nothing of what's on screen.
            // We must send the full command line + \r

            // But wait, if I send 'ls\r', backend will echo 'ls\r\n'.
            // I already have 'ls' on screen.
            // So I will get 'lsls\r\n'.
            // So I MUST clear my local 'ls' before sending.
            term.write("\b \b".repeat(currentInput.current.length));

            ws.send(currentInput.current + "\r");
          } else {
            // Normal typing mode. Backend has the buffer state (mostly).
            // Just send \r
            ws.send("\r");
          }

          // Reset
          historyIndex.current = -1;
          currentInput.current = "";
          return;
        }

        // Handle Backspace tracking
        if (data === "\x7f" || data === "\b") {
          if (currentInput.current.length > 0) {
            currentInput.current = currentInput.current.slice(0, -1);
          }
          ws.send(data);
          return;
        }

        // Normal char
        if (data >= " " && data <= "~") {
          // If we are in history mode and user types a char?
          // "Editing history line".
          // We should send the *rest* of the buffer to backend?
          // Or treat it as appending?
          // Complex. For MVP, if user types while in history, we exit history mode?
          // Better: Just behave as if typing.
          // Problem: Backend buffer is empty, Screen has text.
          // If I type 'x', screen has 'lsx'. Backend has 'x'.
          // Mismatch!

          // Fix: If historyIndex != -1 (we replaced line locally),
          // and user types a new char, we must commit the history line to backend first? No.
          // We effectively have to send the whole history line to backend "invisibly" or...
          // EASIEST MVP: If user edits a history line, we just append to local buffer.
          // BUT when Enter is pressed, we send the WHOLE buffer, clearing local.

          // So:
          // 1. Append char to currentInput.
          // 2. If historyIndex != -1:
          //    We are purely local. Do NOT send char to backend yet (it would echo 'x').
          //    Just Local Echo the char.
          //    Wait, if I don't send to backend, backend process doesn't get it.
          //    If I send to backend, backend gets 'x'. Backend buffer: 'x'. Real cmd: 'lsx'.

          // Solution for Edit-after-History:
          // It's tricky to sync partial backend buffers.
          // Safe approach: When entering History Mode (Up arrow), we accept we are in "Local Draft" mode.
          // ALL subsequent keys (until Enter) are handled LOCALLY only.
          // When Enter is pressed, we send the WHOLE string.

          if (historyIndex.current !== -1) {
            // Local Edit Mode
            currentInput.current += data;
            term.write(data);
            return;
          }

          currentInput.current += data;
          // Send to backend (Standard Echo)
          ws.send(data);
          return;
        }

        // Other keys (Ctrl+C etc) - Pass through, verify buffer state
        // If Ctrl+C, reset buffer
        if (data === "\x03") {
          currentInput.current = "";
          historyIndex.current = -1;
        }

        const fixedData = data.replace(/\x7f/g, "\b");
        ws.send(fixedData);
      }
    });

    // Fit on resize using ResizeObserver for more robust handling
    const resizeObserver = new ResizeObserver(() => {
      if (isActive && fitAddon) {
        // Small animation frame delay to ensure layout is done
        requestAnimationFrame(() => {
          try {
            fitAddon.fit();
          } catch (e) {
            console.error("Fit error", e);
          }
        });
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [workspace, sessionId]); // Re-connect if workspace or session changes

  return (
    <div className="relative h-full w-full bg-[#1e1e1e]">
      <div className="absolute top-2 right-4 z-10 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={clear}
          className="bg-neutral-800 text-neutral-400 hover:text-white px-2 py-1 text-xs rounded border border-neutral-700 shadow-sm cursor-pointer"
        >
          Clear
        </button>
      </div>
      <div
        className="h-full w-full overflow-hidden pl-4 pt-2"
        ref={terminalRef}
      />
    </div>
  );
};
