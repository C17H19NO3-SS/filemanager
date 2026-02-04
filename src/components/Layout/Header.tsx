import { useEditor } from "@/providers/EditorProvider";
import {
  PanelLeft,
  Terminal as TerminalIcon,
  Settings,
  Search,
  ChevronRight,
} from "lucide-react";

export const Header = () => {
  const {
    saveFile,
    activeFile,
    setIsSettingsOpen,
    workspace,
    isTerminalOpen,
    setIsTerminalOpen,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useEditor();

  const workspaceName = workspace
    ? workspace.split(/[\\/]/).pop()
    : "Project Root";

  return (
    <header
      className="flex items-center justify-between h-[35px] px-3 select-none border-b z-50 transition-colors"
      style={{
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Left Section: Branding & Sidebar Toggle */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-[3px] flex items-center justify-center text-white text-[10px] font-bold shadow-sm mr-1"
          style={{ backgroundColor: "var(--accent-color)" }}
        >
          FM
        </div>

        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1 rounded-[3px] transition-colors`}
            style={{
              color: isSidebarOpen ? "var(--accent-color)" : "inherit",
              backgroundColor: isSidebarOpen
                ? "var(--bg-tertiary)"
                : "transparent",
            }}
            title="Toggle Sidebar (Ctrl+B)"
          >
            <PanelLeft size={16} />
          </button>

          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className={`p-1 rounded-[3px] transition-colors`}
            style={{
              color: isTerminalOpen ? "var(--accent-color)" : "inherit",
              backgroundColor: isTerminalOpen
                ? "var(--bg-tertiary)"
                : "transparent",
            }}
            title="Toggle Terminal"
          >
            <TerminalIcon size={16} />
          </button>
        </div>
      </div>

      {/* Center Section: Breadcrumbs / Title */}
      <div className="flex-1 flex justify-center items-center px-4 overflow-hidden">
        <div
          className="flex items-center gap-1.5 text-[12px] px-3 py-1 rounded-md border max-w-[60%] truncate shadow-sm transition-colors"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          <Search size={12} className="shrink-0" />
          <span
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {workspaceName}
          </span>
          {activeFile && (
            <>
              <ChevronRight size={12} className="shrink-0" />
              <span className="truncate">
                {activeFile.replace(/^\//, "").replace(/\//g, " > ")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Section: Settings */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 rounded-[3px] transition-colors hover:brightness-110"
          style={{ backgroundColor: "transparent" }}
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};
