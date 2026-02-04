import React, { useEffect, useState } from "react";
import { TerminalInstance } from "./TerminalInstance";
import { ProblemsView } from "./ProblemsView";
import { useEditor } from "@/providers/EditorProvider";

interface TerminalPanelProps {
  onClose: () => void;
}

interface TerminalTab {
  id: string;
  title: string;
}

export const Terminal: React.FC<TerminalPanelProps> = ({ onClose }) => {
  const [terminals, setTerminals] = useState<TerminalTab[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [activeView, setActiveView] = useState<"terminal" | "problems">(
    "terminal",
  );
  const { lintResults } = useEditor();

  const totalProblems = lintResults.reduce(
    (acc, r) => acc + r.messages.length,
    0,
  );

  useEffect(() => {
    const saved = localStorage.getItem("terminal_sessions");
    const savedActive = localStorage.getItem("terminal_active_id");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setTerminals(parsed);
          setActiveId(
            savedActive && parsed.find((t: any) => t.id === savedActive)
              ? savedActive
              : parsed[0].id,
          );
          return;
        }
      } catch (e) {}
    }
    // Default
    const initialId = Date.now().toString();
    setTerminals([{ id: initialId, title: "Terminal 1" }]);
    setActiveId(initialId);
  }, []);

  useEffect(() => {
    if (terminals.length > 0) {
      localStorage.setItem("terminal_sessions", JSON.stringify(terminals));
      localStorage.setItem("terminal_active_id", activeId);
    }
  }, [terminals, activeId]);

  const addTerminal = () => {
    const id = Date.now().toString();
    const title = `Terminal ${terminals.length + 1}`;
    setTerminals([...terminals, { id, title }]);
    setActiveId(id);
  };

  const removeTerminal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newTerminals = terminals.filter((t) => t.id !== id);
    if (newTerminals.length === 0) {
      localStorage.removeItem("terminal_sessions");
      localStorage.removeItem("terminal_active_id");
      onClose();
    } else {
      setTerminals(newTerminals);
      if (activeId === id) {
        setActiveId(newTerminals[newTerminals.length - 1]?.id || "");
      }
    }
  };

  if (terminals.length === 0) return null;

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] border-t border-neutral-800">
      {/* Top Category Tabs (VS Code Style) */}
      <div className="flex items-center px-4 bg-[#1e1e1e] h-9 gap-5 border-b border-white/5">
        <button
          onClick={() => setActiveView("problems")}
          className={`relative h-full text-[11px] flex items-center gap-1.5 transition-all outline-none ${
            activeView === "problems"
              ? "text-white"
              : "text-[#858585] hover:text-[#cccccc]"
          }`}
        >
          Problems
          {totalProblems > 0 && (
            <span
              className={`text-white text-[10px] px-1.5 py-0 rounded-full min-w-4 text-center font-bold ${
                activeView === "problems" ? "bg-[#007acc]" : "bg-[#4d4d4d]"
              }`}
            >
              {totalProblems}
            </span>
          )}
          {activeView === "problems" && (
            <div className="absolute bottom-0 left-0 w-full h-px bg-[#007acc]" />
          )}
        </button>

        <button
          onClick={() => setActiveView("terminal")}
          className={`relative h-full text-[11px] flex items-center transition-all outline-none ${
            activeView === "terminal"
              ? "text-white"
              : "text-[#858585] hover:text-[#cccccc]"
          }`}
        >
          Terminal
          {activeView === "terminal" && (
            <div className="absolute bottom-0 left-0 w-full h-px bg-[#007acc]" />
          )}
        </button>
      </div>

      {/* Tabs Header */}
      {activeView === "terminal" ? (
        <div className="flex items-center bg-[#252526] border-y border-neutral-800 select-none">
          <div className="flex items-center overflow-x-auto no-scrollbar max-w-[calc(100%-80px)]">
            {terminals.map((term) => (
              <div
                key={term.id}
                onClick={() => setActiveId(term.id)}
                className={`
                group flex items-center gap-2 px-3 py-1.5 text-xs font-medium border-r border-neutral-800 cursor-pointer min-w-[100px] max-w-[200px]
                ${
                  activeId === term.id
                    ? "bg-[#1e1e1e] text-white"
                    : "bg-[#2d2d2d] text-neutral-400 hover:bg-[#2a2a2a]"
                }
              `}
              >
                <span className="truncate flex-1">{term.title}</span>
                <button
                  onClick={(e) => removeTerminal(e, term.id)}
                  className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-neutral-700 ${
                    terminals.length === 1 ? "hidden" : ""
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add Button */}
          <button
            onClick={addTerminal}
            className="flex items-center justify-center w-8 h-7.25 hover:bg-[#333] text-neutral-400 hover:text-white border-r border-neutral-800 transition-colors"
            title="New Terminal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          <div className="flex-1" />

          {/* Close Panel Button */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-7.25 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors ml-auto"
            title="Close Panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-hidden relative">
        {activeView === "terminal" ? (
          terminals.map((term) => (
            <div
              key={term.id}
              className={`absolute inset-0 w-full h-full ${
                activeId === term.id ? "z-10" : "z-0 invisible"
              }`}
            >
              <TerminalInstance
                isActive={activeId === term.id}
                sessionId={term.id}
              />
            </div>
          ))
        ) : (
          <ProblemsView />
        )}
      </div>
    </div>
  );
};
