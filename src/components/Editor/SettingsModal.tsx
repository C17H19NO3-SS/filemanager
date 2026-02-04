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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ color: "var(--text-primary)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-80">
            Settings
          </h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Section: Workspace */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium border-b border-[var(--border-color)] pb-2">
              Workspace
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold opacity-70">
                Root Directory
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={workspaceInput}
                  onChange={(e) => setWorkspaceInput(e.target.value)}
                  placeholder="Absolute path to project root..."
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-sm px-3 py-2 outline-none focus:border-[var(--accent-color)] transition-colors"
                />
                <button
                  onClick={() => fetchBrowse(workspaceInput)}
                  className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm text-xs font-medium transition-all flex items-center gap-2"
                >
                  Browse
                </button>
                <button
                  onClick={() => setWorkspace(workspaceInput)}
                  className="px-4 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium rounded-sm transition-all shadow-sm"
                >
                  Reload
                </button>
              </div>

              {isBrowsing && browserData && (
                <div className="mt-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-md overflow-hidden max-h-60 overflow-y-auto shadow-inner">
                  <div className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-xs sticky top-0">
                    <button
                      onClick={() => fetchBrowse(browserData.parentPath)}
                      className="hover:bg-[var(--bg-tertiary)] p-1 rounded"
                    >
                      ⬆ Up
                    </button>
                    <span className="opacity-50 truncate">
                      {browserData.currentPath}
                    </span>
                  </div>
                  {browserData.directories.map((dir) => (
                    <div
                      key={dir.path}
                      className="flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-tertiary)] group cursor-pointer"
                      onClick={() => fetchBrowse(dir.path)}
                    >
                      <span className="text-sm flex items-center gap-2">
                        📁 {dir.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectWorkspace(dir.path);
                        }}
                        className="text-[10px] bg-[var(--accent-color)] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section: Editor Appearance */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium border-b border-[var(--border-color)] pb-2">
              Appearance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold opacity-70">
                  Color Theme
                </label>
                <div className="relative">
                  <select
                    value={settings.theme}
                    onChange={(e) => setSettings({ theme: e.target.value })}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-sm px-3 py-2 outline-none focus:border-[var(--accent-color)] appearance-none cursor-pointer"
                  >
                    <option value="vscode-dark-plus">
                      VS Code Dark+ (Default)
                    </option>
                    <option value="vscode-light-plus">VS Code Light+</option>
                    <option value="github-dark">GitHub Dark</option>
                    <option value="github-light">GitHub Light</option>
                    <option value="monokai">Monokai</option>
                    <option value="dracula">Dracula</option>
                    <option value="solarized-dark">Solarized Dark</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    ▼
                  </div>
                </div>
                <p className="text-[10px] opacity-50">
                  Controls the overall look and feel of the editor and UI.
                </p>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold opacity-70">
                  Font Size: {settings.fontSize}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="32"
                  value={settings.fontSize}
                  onChange={(e) =>
                    setSettings({ fontSize: parseInt(e.target.value) })
                  }
                  className="w-full h-1 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
                />
              </div>
            </div>
          </section>

          {/* Section: Editor Behavior */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium border-b border-[var(--border-color)] pb-2">
              Editor Behavior
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Toggle
                label="Minimap"
                checked={settings.minimap}
                onChange={(v) => setSettings({ minimap: v })}
                description="Controls whether the minimap is shown."
              />
              <Toggle
                label="Line Numbers"
                checked={settings.lineNumbers === "on"}
                onChange={(v) => setSettings({ lineNumbers: v ? "on" : "off" })}
                description="Controls the display of line numbers."
              />
              <Toggle
                label="Word Wrap"
                checked={settings.wordWrap === "on"}
                onChange={(v) => setSettings({ wordWrap: v ? "on" : "off" })}
                description="Lines will wrap to fit the viewport."
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-70">
                  Tab Size
                </label>
                <select
                  value={settings.tabSize}
                  onChange={(e) =>
                    setSettings({ tabSize: parseInt(e.target.value) })
                  }
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-sm px-2 py-1 outline-none focus:border-[var(--accent-color)]"
                >
                  <option value="2">2 Spaces</option>
                  <option value="4">4 Spaces</option>
                  <option value="8">8 Spaces</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-end">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-6 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-sm shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Component for consistency
const Toggle = ({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) => (
  <div
    className="flex items-start gap-3 p-2 hover:bg-[var(--bg-tertiary)] rounded transition-colors group cursor-pointer"
    onClick={() => onChange(!checked)}
  >
    <div
      className={`w-10 h-5 mt-0.5 rounded-full relative transition-colors ${checked ? "bg-[var(--accent-color)]" : "bg-[var(--bg-tertiary)] border border-[var(--border-color)]"}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${checked ? "left-5" : "left-0.5"}`}
      />
    </div>
    <div>
      <div className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </div>
      {description && (
        <div className="text-[10px] opacity-60 mt-0.5">{description}</div>
      )}
    </div>
  </div>
);
