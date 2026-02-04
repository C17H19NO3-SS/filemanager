import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@/components/Editor/Editor";
import { TabBar } from "@/components/Editor/TabBar";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Terminal } from "@/components/Terminal/Terminal";
import { useEditor } from "@/providers/EditorProvider";

export const Index = () => {
  const { isTerminalOpen, setIsTerminalOpen, isSidebarOpen } = useEditor();

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    return Number(localStorage.getItem("sidebar-width")) || 260;
  });

  const [terminalHeight, setTerminalHeight] = useState(() => {
    return Number(localStorage.getItem("terminal-height")) || 300;
  });

  const isResizingSidebar = useRef(false);
  const isResizingTerminal = useRef(false);

  const startResizingSidebar = useCallback(() => {
    isResizingSidebar.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const startResizingTerminal = useCallback(() => {
    isResizingTerminal.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    isResizingSidebar.current = false;
    isResizingTerminal.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingSidebar.current) {
      const newWidth = Math.max(150, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
      localStorage.setItem("sidebar-width", String(newWidth));
    } else if (isResizingTerminal.current) {
      const newHeight = Math.max(
        100,
        Math.min(window.innerHeight - 200, window.innerHeight - e.clientY),
      );
      setTerminalHeight(newHeight);
      localStorage.setItem("terminal-height", String(newHeight));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <section className="flex flex-1 overflow-hidden relative">
      {isSidebarOpen && (
        <>
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="shrink-0 flex flex-col h-full"
          >
            <Sidebar />
          </div>
          {/* Vertical Resizer */}
          <div
            onMouseDown={startResizingSidebar}
            className="w-1 hover:w-1.5 bg-transparent hover:bg-blue-500/50 cursor-col-resize transition-all z-20"
          />
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <TabBar />
          <div className="flex-1 overflow-hidden relative">
            <Editor />
          </div>
        </div>

        {isTerminalOpen && (
          <>
            {/* Horizontal Resizer */}
            <div
              onMouseDown={startResizingTerminal}
              className="h-1 hover:h-1.5 bg-transparent hover:bg-blue-500/50 cursor-row-resize transition-all z-20"
            />
            <div
              style={{ height: `${terminalHeight}px` }}
              className="overflow-hidden bg-[#1e1e1e]"
            >
              <Terminal onClose={() => setIsTerminalOpen(false)} />
            </div>
          </>
        )}
      </div>
    </section>
  );
};
