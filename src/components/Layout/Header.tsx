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
    <header className="flex items-center justify-between bg-[#3c3c3c] text-[#cccccc] h-[35px] px-3 select-none border-b border-[#2b2b2b] z-50">
      {/* Left Section: Branding & Sidebar Toggle */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-[#007acc] rounded-[3px] flex items-center justify-center text-white text-[10px] font-bold shadow-sm mr-1">
          FM
        </div>

        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1 rounded-[3px] transition-colors ${
              isSidebarOpen
                ? "text-[#007acc] bg-[#454545]"
                : "hover:bg-[#505050]"
            }`}
            title="Toggle Sidebar (Ctrl+B)"
          >
            <PanelLeft size={16} />
          </button>

          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className={`p-1 rounded-[3px] transition-colors ${
              isTerminalOpen
                ? "text-[#007acc] bg-[#454545]"
                : "hover:bg-[#505050]"
            }`}
            title="Toggle Terminal"
          >
            <TerminalIcon size={16} />
          </button>
        </div>
      </div>

      {/* Center Section: Breadcrumbs / Title */}
      <div className="flex-1 flex justify-center items-center px-4 overflow-hidden">
        <div className="flex items-center gap-1.5 text-[12px] text-[#969696] bg-[#2d2d2d] px-3 py-1 rounded-md border border-[#454545] max-w-[60%] truncate shadow-sm">
          <Search size={12} className="shrink-0" />
          <span className="font-semibold text-[#cccccc]">{workspaceName}</span>
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
          className="p-1.5 hover:bg-[#505050] rounded-[3px] transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};
