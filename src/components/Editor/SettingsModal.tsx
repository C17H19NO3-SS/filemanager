import React from "react";
import { useEditor } from "@/providers/EditorProvider";

export const SettingsModal = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    settings,
    setSettings,
    workspace,
    setWorkspace,
  } = useEditor();

  const [workspaceInput, setWorkspaceInput] = React.useState(workspace);
  const [isBrowsing, setIsBrowsing] = React.useState(false);
  const [browserData, setBrowserData] = React.useState<{
    currentPath: string;
    parentPath: string;
    directories: { name: string; path: string }[];
  } | null>(null);

  const fetchBrowse = async (path?: string) => {
    try {
      const url = `/api/files/browse-directories${path ? `?path=${encodeURIComponent(path)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setBrowserData(data);
      setIsBrowsing(true);
    } catch (e) {
      console.error("Browse failed", e);
    }
  };

  const handleSelectWorkspace = (path: string) => {
    setWorkspaceInput(path);
    setIsBrowsing(false);
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#1e1e1e] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#252526]">
          <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">
            Editor Settings
          </h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 hover:bg-neutral-700 rounded-md text-neutral-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
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

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Workspace Switcher */}
          <div className="space-y-3 pb-6 border-b border-neutral-800">
            <label className="text-xs font-bold text-blue-400 uppercase tracking-tight">
              Active Workspace
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={workspaceInput}
                onChange={(e) => setWorkspaceInput(e.target.value)}
                placeholder="Absolute path to project root..."
                className="flex-1 bg-[#2d2d2d] border border-neutral-700 text-neutral-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={() => fetchBrowse(workspaceInput)}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg border border-neutral-700 transition-all flex items-center gap-2"
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
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                Browse
              </button>
              <button
                onClick={() => setWorkspace(workspaceInput)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                Apply
              </button>
            </div>

            {isBrowsing && browserData && (
              <div className="mt-4 bg-black/30 rounded-lg border border-neutral-800 divide-y divide-neutral-800/50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 bg-neutral-800/30 flex items-center justify-between gap-4">
                  <div className="text-[10px] text-neutral-400 truncate flex-1 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {browserData.currentPath}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setWorkspace(browserData.currentPath)}
                      className="text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-2 py-0.5 rounded font-bold transition-all"
                    >
                      Select This Folder
                    </button>
                    <button
                      onClick={() => setIsBrowsing(false)}
                      className="text-[10px] text-neutral-500 hover:text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                  {/* Up button */}
                  <button
                    onClick={() => fetchBrowse(browserData.parentPath)}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-5 h-5 flex items-center justify-center text-neutral-500 group-hover:text-blue-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </div>
                    <span className="text-xs text-neutral-400 font-medium">
                      ..
                    </span>
                  </button>

                  {browserData.directories.map((dir) => (
                    <div key={dir.path} className="flex group">
                      <button
                        onClick={() => fetchBrowse(dir.path)}
                        className="flex-1 text-left px-3 py-2 hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-blue-500/60 group-hover:text-blue-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </div>
                        <span className="text-xs text-neutral-300 font-medium truncate">
                          {dir.name}
                        </span>
                      </button>
                      <button
                        onClick={() => handleSelectWorkspace(dir.path)}
                        className="px-3 py-2 opacity-0 group-hover:opacity-100 hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold uppercase transition-all border-l border-neutral-800/50"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[10px] text-neutral-500 italic">
              Leave empty for server default (cwd)
            </p>
          </div>
          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-neutral-400">
                Font Size
              </label>
              <span className="text-xs text-blue-400 font-mono">
                {settings.fontSize}px
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="24"
              step="1"
              value={settings.fontSize}
              onChange={(e) =>
                setSettings({ fontSize: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ theme: e.target.value })}
              className="w-full bg-[#2d2d2d] border border-neutral-700 text-neutral-200 text-xs rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="vs-dark">Visual Studio Dark</option>
              <option value="vs-light">Visual Studio Light</option>
              <option value="hc-black">High Contrast Black</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50 cursor-pointer hover:bg-neutral-800 transition-colors group">
              <input
                type="checkbox"
                checked={settings.minimap}
                onChange={(e) => setSettings({ minimap: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">
                Minimap
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50 cursor-pointer hover:bg-neutral-800 transition-colors group">
              <input
                type="checkbox"
                checked={settings.wordWrap === "on"}
                onChange={(e) =>
                  setSettings({ wordWrap: e.target.checked ? "on" : "off" })
                }
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">
                Word Wrap
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50 cursor-pointer hover:bg-neutral-800 transition-colors group">
              <input
                type="checkbox"
                checked={settings.lineNumbers === "on"}
                onChange={(e) =>
                  setSettings({ lineNumbers: e.target.checked ? "on" : "off" })
                }
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">
                Line Numbers
              </span>
            </label>

            {/* Tab Size */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400">
                Tab Size
              </label>
              <select
                value={settings.tabSize}
                onChange={(e) =>
                  setSettings({ tabSize: parseInt(e.target.value) })
                }
                className="w-full bg-[#2d2d2d] border border-neutral-700 text-neutral-200 text-xs rounded-lg p-2 outline-none focus:border-blue-500 transition-colors"
              >
                <option value="2">2 Spaces</option>
                <option value="4">4 Spaces</option>
                <option value="8">8 Spaces</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#252526] border-t border-neutral-800 flex justify-end">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            Done
          </button>
        </div>
      </div>
      <div
        className="absolute inset-0 -z-10"
        onClick={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
