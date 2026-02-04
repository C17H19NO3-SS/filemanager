import { Elysia } from "elysia";
import path from "node:path";

const sessions = new Map<
  string,
  {
    proc: any;
    history: string[]; // Keep last N chunks to replay
    sockets: Set<any>;
  }
>();

export const terminalEndpoint = new Elysia({ prefix: "/api/terminal" }).ws(
  "/ws",
  {
    open(ws: any) {
      const query = ws.data.query || {};
      const cwd = query.cwd;
      const sessionId = query.sessionId || Date.now().toString();

      ws.data.sessionId = sessionId;

      let session = sessions.get(sessionId);

      // If session exists, re-attach
      if (session) {
        session.sockets.add(ws);
        // Replay history
        for (const chunk of session.history) {
          ws.send(chunk);
        }
        return;
      }

      // Create new session
      const workingDir = cwd
        ? path.resolve(cwd).replace(/\\/g, "/")
        : process.cwd();

      // Detect shell
      const shell = process.platform === "win32" ? "powershell.exe" : "bash";
      const args =
        process.platform === "win32"
          ? [
              "-NoLogo",
              "-NoExit",
              "-Command",
              'Remove-Item Alias:clear -Force -ErrorAction SilentlyContinue; Remove-Item Alias:cls -Force -ErrorAction SilentlyContinue; function global:clear { Write-Output "$([char]27)[2J$([char]27)[3J$([char]27)[H" }; function global:cls { clear }',
            ]
          : ["-i"];

      try {
        const proc = Bun.spawn([shell, ...args], {
          cwd: workingDir,
          stdin: "pipe",
          stdout: "pipe",
          stderr: "pipe",
          env: {
            ...process.env,
            TERM: "xterm-256color",
            FORCE_COLOR: "1",
            NPM_CONFIG_COLOR: "always",
            MOCHA_COLORS: "1",
          },
        });

        session = {
          proc,
          history: [],
          sockets: new Set([ws]),
        };
        sessions.set(sessionId, session);

        // Consume stdout
        const handleOutput = async (readable: ReadableStream) => {
          const reader = readable.getReader();
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);

              // Store in history (limit to last 1MB or similar roughly?)
              // For simplicity, just append. Ideally handle circular buffer.
              const s = sessions.get(sessionId);
              if (s) {
                s.history.push(chunk);
                if (s.history.length > 5000) s.history.shift();
                // Broadcast
                for (const socket of s.sockets) {
                  socket.send(chunk);
                }
              }
            }
          } catch (e) {
            console.error("Stream error", e);
          }
        };

        handleOutput(proc.stdout);
        handleOutput(proc.stderr);
      } catch (e) {
        ws.send(`\r\nError starting terminal: ${e}\r\n`);
        ws.close();
      }
    },
    message(ws: any, message) {
      const sessionId = ws.data.sessionId;
      const session = sessions.get(sessionId);
      if (!session) return;

      const proc = session.proc;
      if (proc && proc.stdin) {
        if (typeof message === "string") {
          // Check for explicit kill command from frontend
          if (message === "__KILL_SESSION__") {
            proc.kill();
            sessions.delete(sessionId);
            ws.close();
            return;
          }
          proc.stdin.write(message);
          proc.stdin.flush();
        }
      }
    },
    close(ws: any) {
      const sessionId = ws.data.sessionId;
      const session = sessions.get(sessionId);
      if (session) {
        session.sockets.delete(ws);
        // Do NOT kill process here, ensuring persistence on reload
      }
    },
  },
);
