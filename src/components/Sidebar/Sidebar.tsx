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
    const isSpecial = [
      "src",
      "components",
      "providers",
      "Layout",
      "utils",
      "helpers",
      "node_modules",
    ].includes(name);
    // Generic Folder Icon
    return (
      <svg
        className={`w-4 h-4 ${isSpecial ? "text-blue-400" : isOpen ? "text-neutral-200" : "text-neutral-400"}`}
        viewBox="0 0 24 24"
        fill={isOpen ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    );
  }

  const ext = name.split(".").pop()?.toLowerCase();

  // TypeScript
  if (ext === "ts" || ext === "tsx") {
    return (
      <svg
        className="w-4 h-4 text-blue-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 13v2" strokeWidth="2" />
        <path d="M9 15h2" strokeWidth="1.5" />
        <path d="M15 13l-1.5 2 1.5 2" strokeWidth="1.5" />
      </svg>
    );
  }

  // JavaScript
  if (ext === "js" || ext === "jsx" || ext === "mjs" || ext === "cjs") {
    return (
      <svg
        className="w-4 h-4 text-yellow-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M10 13a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2" />
        <path d="M16 13c-1 0-2 1-2 2v1c0 1 1 2 2 2" />
      </svg>
    );
  }

  // HTML
  if (ext === "html" || ext === "htm") {
    return (
      <svg
        className="w-4 h-4 text-orange-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M8 13l-2 2 2 2" />
        <path d="M16 13l2 2-2 2" />
      </svg>
    );
  }

  // CSS / SCSS
  if (ext === "css" || ext === "scss" || ext === "less" || ext === "sass") {
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M10 13l-2 2 2-2" />
        <path d="M14 13l2 2-2-2" />
      </svg>
    );
  }

  // JSON
  if (ext === "json" || name === ".lock") {
    return (
      <svg
        className="w-4 h-4 text-yellow-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M10 12c-1 0-1.5.5-1.5 1s.5 1 1.5 1" />
        <path d="M14 12c1 0 1.5.5 1.5 1s-.5 1-1.5 1" />
      </svg>
    );
  }

  // Markdown
  if (ext === "md" || ext === "txt") {
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }

  // Images
  if (["png", "jpg", "jpeg", "svg", "gif", "ico", "webp"].includes(ext || "")) {
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
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }

  // Default File
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
        className={`flex items-center h-5.5 px-2 cursor-pointer group select-none relative transition-colors`}
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
              className="absolute top-0 bottom-0 border-l border-(--border-color)/50"
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
    <aside className="w-full flex flex-col h-full border-r border-(--border-color) select-none bg-(--bg-secondary)">
      <div className="flex items-center justify-between px-4 py-2 group/header cursor-pointer h-9 transition-colors text-(--text-secondary)">
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
            className="p-1 hover:bg-(--bg-tertiary) rounded text-(--text-secondary)"
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
            className="p-1 hover:bg-(--bg-tertiary) rounded text-(--text-secondary)"
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
            className="p-1 hover:bg-(--bg-tertiary) rounded text-(--text-secondary)"
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
            className="p-1 hover:bg-(--bg-tertiary) rounded text-(--text-secondary)"
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
