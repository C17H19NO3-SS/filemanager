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
      className="flex h-[35px] overflow-x-auto no-scrollbar border-b"
      ref={scrollRef}
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--bg-primary)",
      }}
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
              backgroundColor: isActive
                ? "var(--bg-primary)"
                : "var(--bg-input)",
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              borderTop: isActive
                ? "1px solid var(--accent-color)"
                : "1px solid transparent",
              borderColor: "var(--border-color)",
            }}
            className={`
              flex items-center px-3 group cursor-pointer border-r 
              select-none relative text-[13px] h-full transition-colors
            `}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "var(--bg-input)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
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
