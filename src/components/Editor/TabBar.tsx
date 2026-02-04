import React, { useRef, useEffect } from "react";
import { useEditor } from "@/providers/EditorProvider";
import { X } from "lucide-react";

export const TabBar: React.FC = () => {
  const { openFiles, activeFile, setActiveFile, closeFile } = useEditor();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeFile && scrollRef.current) {
      const activeTab = scrollRef.current.querySelector('[data-active="true"]');
      if (activeTab) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }
  }, [activeFile]);

  const getFileIcon = (path: string) => {
    const ext = path.split(".").pop();
    switch (ext) {
      case "tsx":
      case "ts":
        return <span className="text-[#007acc] text-[12px] font-bold">TS</span>;
      case "jsx":
      case "js":
        return <span className="text-[#f1d812] text-[12px] font-bold">JS</span>;
      case "json":
        return <span className="text-[#cbcb41] text-[12px]">{"{}"}</span>;
      case "css":
        return <span className="text-[#42a5f5] text-[12px]">#</span>;
      case "html":
        return <span className="text-[#e44d26] text-[12px]">&lt;&gt;</span>;
      default:
        return <span className="text-gray-400 text-[12px]">?</span>;
    }
  };

  const getFileName = (path: string) => {
    return path.split("/").pop() || path;
  };

  if (openFiles.length === 0) return null;

  return (
    <div
      className="flex h-[35px] bg-[#252526] overflow-x-auto no-scrollbar border-b border-[#1e1e1e]"
      ref={scrollRef}
    >
      {openFiles.map((path) => {
        const isActive = activeFile === path;
        const fileName = getFileName(path);

        return (
          <div
            key={path}
            data-active={isActive}
            onClick={() => setActiveFile(path)}
            onMouseDown={(e) => {
              if (e.button === 1) {
                // Middle click to close
                e.preventDefault();
                closeFile(path);
              }
            }}
            style={{
              maxWidth: "200px",
              minWidth: "120px",
              backgroundColor: isActive ? "#1e1e1e" : "#2d2d2d",
              color: isActive ? "#ffffff" : "#969696",
              borderTop: isActive
                ? "1px solid #007acc"
                : "1px solid transparent",
            }}
            className={`
              flex items-center px-3 group cursor-pointer border-r border-[#1e1e1e] 
              select-none relative text-[13px] h-full transition-colors
              ${!isActive && "hover:bg-[#2a2d2e] hover:text-[#cccccc]"}
            `}
            title={path}
          >
            <div className="mr-2 shrink-0">{getFileIcon(path)}</div>

            <span className="truncate flex-1">{fileName}</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(path);
              }}
              className={`
                ml-2 p-0.5 rounded-[3px] opacity-0 group-hover:opacity-100 
                hover:bg-[#454545] transition-all flex items-center justify-center
                ${isActive ? "opacity-100" : ""}
              `}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
