import { useEditor } from "@/providers/EditorProvider";
import { useState, useMemo } from "react";

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileNode[];
}

const FileIcon = ({
  name,
  isDirectory,
  isOpen,
}: {
  name: string;
  isDirectory: boolean;
  isOpen?: boolean;
}) => {
  if (isDirectory) {
    if (name === "src") {
      return (
        <svg
          className="w-4 h-4 text-orange-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <polyline points="9 11 7 13 9 15" />
          <polyline points="13 11 15 13 13 15" />
        </svg>
      );
    }
    if (name === "components" || name === "providers" || name === "Layout") {
      return (
        <svg
          className="w-4 h-4 text-emerald-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="2" />
        </svg>
      );
    }
    if (name === "node_modules") {
      return (
        <svg
          className="w-4 h-4 text-emerald-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <path d="M12 11v4M10 13h4" />
        </svg>
      );
    }
    if (name === "helpers" || name === "utils") {
      return (
        <svg
          className="w-4 h-4 text-purple-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <path d="M15 11l-3 3-3-3" />
        </svg>
      );
    }
    return (
      <svg
        className={`w-4 h-4 ${isOpen ? "text-neutral-300" : "text-neutral-500"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    );
  }

  const ext = name.split(".").pop();
  switch (ext) {
    case "tsx":
    case "jsx":
      return (
        <svg
          className="w-4 h-4 text-blue-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" strokeOpacity="0.5" />
        </svg>
      );
    case "ts":
      return (
        <div className="w-4 h-4 bg-[#3178c6] flex items-center justify-center rounded-[2px] overflow-hidden">
          <span className="text-white text-[9px] font-bold leading-none mt-1">
            TS
          </span>
        </div>
      );
    case "css":
      return (
        <div className="w-4 h-4 bg-[#264de4] flex items-center justify-center rounded-[2px] overflow-hidden">
          <span className="text-white text-[12px] font-bold leading-none">
            #
          </span>
        </div>
      );
    case "html":
      return (
        <div className="w-4 h-4 bg-[#e34c26] flex items-center justify-center rounded-[2px] overflow-hidden">
          <span className="text-white text-[10px] font-bold leading-none">
            &lt;&gt;
          </span>
        </div>
      );
    case "json":
    case "lock":
      return (
        <div className="w-4 h-4 text-[#cbcb41] flex items-center justify-center font-bold text-[12px]">
          {"{ }"}
        </div>
      );
    case "gitignore":
      return (
        <svg
          className="w-4 h-4 text-[#f1502f]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
    case "md":
      return (
        <svg
          className="w-4 h-4 text-blue-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 5H3v14h18V5zM7 7v10M11 7l3 3 3-3M14 17h3" />
        </svg>
      );
    default:
      return (
        <svg
          className="w-4 h-4 text-neutral-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      );
  }
};

const TreeItem = ({ node, depth }: { node: FileNode; depth: number }) => {
  const { activeFile, setActiveFile, fetchDirectory } = useEditor();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = async () => {
    if (node.isDirectory) {
      if (!isOpen) {
        await fetchDirectory(node.path);
      }
      setIsOpen(!isOpen);
    } else {
      setActiveFile(node.path);
    }
  };

  const isSelected = activeFile === node.path;
  const paddingLeft = depth * 12 + 16;

  // Visual markers matching screenshot
  const isYellow =
    node.path === "/src/index.css" ||
    node.path.includes("/styles/") ||
    node.path === "/src/";
  const showBadge = node.path === "/src/index.css";

  return (
    <div>
      <div
        className={`flex items-center h-[22px] px-2 cursor-pointer group select-none relative transition-colors`}
        style={{
          paddingLeft: `${paddingLeft}px`,
          backgroundColor: isSelected
            ? "var(--selection-color)"
            : "transparent",
          color: isSelected ? "white" : "var(--text-primary)",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
        onClick={handleClick}
      >
        {/* Indent Lines */}
        {depth > 0 &&
          Array.from({ length: depth }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-neutral-800/50"
              style={{ left: `${(i + 1) * 12 + 8}px` }}
            />
          ))}

        <span className="mr-1.5 shrink-0 w-4 flex items-center justify-center">
          {node.isDirectory && (
            <svg
              className={`w-3 h-3 text-[#c5c5c5] transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </span>

        <div className="shrink-0 mr-1.5 scale-90">
          <FileIcon
            name={node.name}
            isDirectory={node.isDirectory}
            isOpen={isOpen}
          />
        </div>

        <span
          className={`text-[13px] truncate ${isYellow && !isSelected ? "text-[#d1b01c]" : ""}`}
        >
          {node.name}
        </span>

        {isYellow && (
          <div className="ml-auto flex items-center pr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d1b01c] opacity-80" />
            {showBadge && (
              <span className="text-[10px] text-[#d1b01c] font-bold ml-1">
                1
              </span>
            )}
          </div>
        )}
      </div>

      {node.isDirectory && isOpen && (
        <div className="relative">
          {node.children.map((child) => (
            <TreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar = () => {
  const { files, createFile } = useEditor();

  const tree = useMemo(() => {
    const root: FileNode = {
      name: "filemanager",
      path: "/",
      isDirectory: true,
      children: [],
    };

    files.forEach((path) => {
      const parts = path.split("/").filter(Boolean);
      let current = root;

      parts.forEach((part, index) => {
        const isDir = index < parts.length - 1 || path.endsWith("/");
        let child = current.children.find((c) => c.name === part);

        if (!child) {
          child = {
            name: part,
            path:
              "/" + parts.slice(0, index + 1).join("/") + (isDir ? "/" : ""),
            isDirectory: isDir,
            children: [],
          };
          current.children.push(child);
        }
        current = child;
      });
    });

    const sortNodes = (node: FileNode) => {
      node.children.sort((a, b) => {
        if (a.isDirectory === b.isDirectory)
          return a.name.localeCompare(b.name);
        return a.isDirectory ? -1 : 1;
      });
      node.children.forEach(sortNodes);
    };
    sortNodes(root);

    return root;
  }, [files]);

  return (
    <aside
      className="w-full flex flex-col h-full border-r select-none"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 group/header cursor-pointer h-9 transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <svg
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-wider truncate">
            filemanager
          </span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
          <button
            onClick={() => createFile(prompt("Enter file name") || "")}
            className="p-1 hover:bg-[#2a2d2e] rounded text-[#c5c5c5]"
            title="New File"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            className="p-1 hover:bg-[#2a2d2e] rounded text-[#c5c5c5]"
            title="New Folder"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <path d="M12 11v4M10 13h4" />
            </svg>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-1 hover:bg-[#2a2d2e] rounded text-[#c5c5c5]"
            title="Refresh"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <button
            className="p-1 hover:bg-[#2a2d2e] rounded text-[#c5c5c5]"
            title="Collapse All"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 14h7l-3 3 3 3" />
              <path d="M20 10h-7l3-3-3-3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tree.children.map((child) => (
          <TreeItem key={child.path} node={child} depth={0} />
        ))}
      </div>
    </aside>
  );
};
