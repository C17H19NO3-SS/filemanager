import React, { useState } from "react";
import { useEditor } from "@/providers/EditorProvider";
import type { LintResult } from "@/providers/EditorProvider";
import { Copy, Check } from "lucide-react";

export const ProblemsView: React.FC = () => {
  const { lintResults, setActiveFile } = useEditor();
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>(
    {},
  );
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const toggleFile = (path: string) => {
    setCollapsedFiles((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getFileIcon = (path: string) => {
    const ext = path.split(".").pop();
    if (ext === "json") return "{}";
    if (ext === "tsx") return "TSX";
    if (ext === "ts") return "TS";
    if (ext === "jsx") return "JSX";
    if (ext === "js") return "JS";
    return "?";
  };

  const copyToClipboard = async (
    results: LintResult[],
    fileName?: string,
    statusKey: string = "all",
  ) => {
    const targetResults = fileName
      ? results.filter((r) => r.filePath.endsWith(fileName))
      : results;

    const text = targetResults
      .map((res) => {
        return (
          `[${res.filePath}]\n` +
          res.messages
            .map((m) => ` - Ln ${m.line}, Col ${m.column}: ${m.message}`)
            .join("\n")
        );
      })
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(statusKey);
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden select-text">
      {/* Search/Actions Bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 text-[11px] text-[#858585] border-b border-white/5">
        <button
          onClick={() => copyToClipboard(lintResults, undefined, "all")}
          className="hover:text-white transition-colors flex items-center gap-1.5"
        >
          {copyStatus === "all" ? (
            <Check size={12} className="text-green-500" />
          ) : (
            <Copy size={12} />
          )}
          <span>Copy All Problems</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-1">
        {lintResults.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <p className="text-sm">
              No problems have been detected in the workspace.
            </p>
          </div>
        )}

        {lintResults.map((result, resIdx) => {
          const isCollapsed = collapsedFiles[result.filePath];
          const fileName = result.filePath.split("/").pop();
          const fileDir = result.filePath
            .split("/")
            .slice(0, -1)
            .join("\\")
            .replace(/^\\/, "");

          return (
            <div key={resIdx} className="flex flex-col">
              {/* File Row */}
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[#2a2d2e] cursor-pointer group"
                onClick={() => toggleFile(result.filePath)}
              >
                <span
                  className={`transition-transform duration-100 text-[#858585] ${isCollapsed ? "-rotate-90" : ""}`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M7.976 10.072l4.357-4.357.62.618-4.977 4.977L3.003 6.337l.618-.617 4.355 4.352z" />
                  </svg>
                </span>

                <span className="text-blue-400 text-[9px] font-bold min-w-4 leading-none flex items-center justify-center border border-blue-400/30 rounded-sm h-3.5 mt-0.5 whitespace-nowrap px-0.5 tracking-tighter">
                  {getFileIcon(result.filePath)}
                </span>

                <span className="text-xs font-medium text-[#cccccc]">
                  {fileName}
                </span>
                <span className="text-[11px] text-[#858585] ml-1">
                  {fileDir}
                </span>

                <div className="flex items-center gap-3 ml-2">
                  <div className="bg-[#4d4d4d] text-white text-[10px] px-1.5 rounded-full min-w-4 text-center font-bold">
                    {result.messages.length}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(lintResults, fileName, result.filePath);
                    }}
                    className="flex items-center gap-1 p-1 rounded hover:bg-[#454545] opacity-0 group-hover:opacity-100 transition-all"
                    title="Copy File Problems"
                  >
                    {copyStatus === result.filePath ? (
                      <Check size={12} className="text-green-500" />
                    ) : (
                      <Copy size={12} className="text-[#858585]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Messages */}
              {!isCollapsed && (
                <div className="flex flex-col pb-1">
                  {result.messages.map((msg, msgIdx) => (
                    <div
                      key={msgIdx}
                      className="flex items-start gap-2.5 px-8 py-0.5 hover:bg-[#2a2d2e] cursor-pointer"
                      onClick={() => setActiveFile(result.filePath)}
                    >
                      <div className="shrink-0 mt-1">
                        {msg.severity === 2 ? (
                          <svg
                            className="text-[#f14c4c]"
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm3.5 9.7l-.8.8L8 8.8l-2.7 2.7-.8-.8L7.2 8 4.5 5.3l.8-.8L8 7.2l2.7-2.7.8.8L8.8 8l2.7 2.7z" />
                          </svg>
                        ) : (
                          <svg
                            className="text-[#cca700]"
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path d="M7.56 1.74l-6.29 11c-.3.52-.3 1.16 0 1.68.31.52.87.84 1.48.84h12.5a1.72 1.72 0 001.48-.84c.3-.52.3-1.16 0-1.68l-6.29-11C10.14 1.25 9.61 1 9 1s-1.14.25-1.44.74zM9 13H8v-1h1v1zm0-2H8V6h1v5z" />
                          </svg>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between w-full min-w-0 pr-4">
                        <span className="text-xs text-[#cccccc] leading-5 wrap-break-word">
                          {msg.message}
                          <span className="text-[#858585] ml-2 font-mono">
                            ts [Ln {msg.line}, Col {msg.column}]
                          </span>
                        </span>
                        <div className="shrink-0 text-[#858585] ml-2">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="rotate-0"
                          >
                            <path d="M7.976 5.928l4.357 4.357-.62.618-4.977-4.977-4.977 4.977-.618-.618 4.355-4.352z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
