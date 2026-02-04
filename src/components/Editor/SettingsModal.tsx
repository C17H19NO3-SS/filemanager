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

  // Global Theme Management
  React.useEffect(() => {
    // Assuming THEMES is imported or defined elsewhere, e.g., from EditorProvider or a constants file
    // For now, let's define a placeholder for THEMES to make this syntactically correct
    const THEMES: { [key: string]: Record<string, string> } = {
      "vscode-dark-plus": {
        "--bg-primary": "#1e1e1e",
        "--bg-secondary": "#252526",
        "--bg-tertiary": "#333333",
        "--bg-input": "#3c3c3c",
        "--border-color": "#444444",
        "--text-primary": "#cccccc",
        "--accent-color": "#007acc",
        "--accent-hover": "#0060a0",
      },
      "vscode-light-plus": {
        "--bg-primary": "#ffffff",
        "--bg-secondary": "#f3f3f3",
        "--bg-tertiary": "#e0e0e0",
        "--bg-input": "#f0f0f0",
        "--border-color": "#d4d4d4",
        "--text-primary": "#333333",
        "--accent-color": "#007acc",
        "--accent-hover": "#0060a0",
      },
      "github-dark": {
        "--bg-primary": "#0d1117",
        "--bg-secondary": "#161b22",
        "--bg-tertiary": "#21262d",
        "--bg-input": "#21262d",
        "--border-color": "#30363d",
        "--text-primary": "#c9d1d9",
        "--accent-color": "#238636",
        "--accent-hover": "#2ea043",
      },
      "github-light": {
        "--bg-primary": "#ffffff",
        "--bg-secondary": "#f6f8fa",
        "--bg-tertiary": "#eaecef",
        "--bg-input": "#f0f0f0",
        "--border-color": "#d0d7de",
        "--text-primary": "#24292f",
        "--accent-color": "#2ea043",
        "--accent-hover": "#2c974b",
      },
      monokai: {
        "--bg-primary": "#272822",
        "--bg-secondary": "#383830",
        "--bg-tertiary": "#49483e",
        "--bg-input": "#3e3d32",
        "--border-color": "#666666",
        "--text-primary": "#f8f8f2",
        "--accent-color": "#ae81ff",
        "--accent-hover": "#966ad8",
      },
      dracula: {
        "--bg-primary": "#282a36",
        "--bg-secondary": "#343746",
        "--bg-tertiary": "#44475a",
        "--bg-input": "#3a3c4e",
        "--border-color": "#6272a4",
        "--text-primary": "#f8f8f2",
        "--accent-color": "#bd93f9",
        "--accent-hover": "#a47bdc",
      },
      "solarized-dark": {
        "--bg-primary": "#002b36",
        "--bg-secondary": "#073642",
        "--bg-tertiary": "#586e75",
        "--bg-input": "#042028",
        "--border-color": "#586e75",
        "--text-primary": "#839496",
        "--accent-color": "#268bd2",
        "--accent-hover": "#217bbd",
      },
    };

    const targetTheme = (THEMES[settings.theme] ||
      THEMES["vscode-dark-plus"] ||
      {}) as Record<string, string>;
    const root = document.documentElement;

    Object.entries(targetTheme).forEach(([key, value]) => {
      if (typeof value === "string") {
        root.style.setProperty(key, value);
      }
    });

    // Also update meta theme-color
    const bgSecondary = targetTheme["--bg-secondary"];
    if (bgSecondary) {
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", bgSecondary);
    }
  }, [settings.theme]);

  const handleSelectWorkspace = (path: string) => {
    setWorkspaceInput(path);
    setIsBrowsing(false);
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-(--bg-primary) border border-(--border-color) rounded-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ color: "var(--text-primary)" }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-medium">Settings</h2>
          {/* Optional: Add X button if desired, or rely on Footer Close */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Section: Workspace */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium border-b border-(--border-color) pb-2">
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
                  className="flex-1 bg-(--bg-input) border border-(--border-color) text-(--text-primary) text-sm rounded-xs px-2 py-1 outline-none focus:border-(--accent-color) transition-colors h-6.5"
                />
                <button
                  onClick={() => fetchBrowse(workspaceInput)}
                  className="px-3 bg-(--bg-secondary) hover:bg-(--bg-tertiary) border border-(--border-color) rounded-xs text-xs transition-all h-6.5"
                >
                  Browse
                </button>
                <button
                  onClick={() => setWorkspace(workspaceInput)}
                  className="px-3 bg-(--accent-color) hover:bg-(--accent-hover) text-white text-xs rounded-xs transition-all shadow-sm h-6.5"
                >
                  Reload
                </button>
              </div>

              {isBrowsing && browserData && (
                <div className="mt-2 bg-(--bg-input) border border-(--border-color) rounded-sm overflow-hidden max-h-60 overflow-y-auto shadow-sm">
                  <div className="flex items-center gap-2 p-2 bg-(--bg-secondary) border-b border-(--border-color) text-xs sticky top-0">
                    <button
                      onClick={() => fetchBrowse(browserData.parentPath)}
                      className="hover:bg-(--bg-tertiary) p-1 rounded"
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
                      className="flex items-center justify-between px-3 py-2 hover:bg-(--bg-tertiary) group cursor-pointer"
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
                        className="text-[10px] bg-(--accent-color) text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
            <h3 className="text-lg font-medium border-b border-(--border-color) pb-2">
              Appearance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold opacity-70">
                  Color Theme
                </label>
                <div className="relative z-20">
                  <CustomSelect
                    value={settings.theme}
                    onChange={(val) => setSettings({ theme: val })}
                    options={[
                      {
                        value: "vscode-dark-plus",
                        label: "VS Code Dark+ (Default)",
                      },
                      { value: "vscode-light-plus", label: "VS Code Light+" },
                      { value: "github-dark", label: "GitHub Dark" },
                      { value: "github-light", label: "GitHub Light" },
                      { value: "monokai", label: "Monokai" },
                      { value: "dracula", label: "Dracula" },
                      { value: "solarized-dark", label: "Solarized Dark" },
                    ]}
                  />
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
                  className="w-full h-1 bg-(--bg-tertiary) rounded-none appearance-none cursor-pointer accent-(--accent-color)"
                />
              </div>
            </div>
          </section>

          {/* Section: Editor Behavior */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium border-b border-(--border-color) pb-2">
              Editor Behavior
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Checkbox
                label="Minimap"
                checked={settings.minimap}
                onChange={(v) => setSettings({ minimap: v })}
                description="Controls whether the minimap is shown."
              />
              <Checkbox
                label="Line Numbers"
                checked={settings.lineNumbers === "on"}
                onChange={(v) => setSettings({ lineNumbers: v ? "on" : "off" })}
                description="Controls display of line numbers."
              />
              <Checkbox
                label="Word Wrap"
                checked={settings.wordWrap === "on"}
                onChange={(v) => setSettings({ wordWrap: v ? "on" : "off" })}
                description="Lines will wrap to fit the viewport."
              />
              <div className="space-y-1 relative z-10 p-1">
                <label className="text-xs font-semibold opacity-70">
                  Tab Size
                </label>
                <CustomSelect
                  value={settings.tabSize.toString()}
                  onChange={(val) => setSettings({ tabSize: parseInt(val) })}
                  options={[
                    { value: "2", label: "2 Spaces" },
                    { value: "4", label: "4 Spaces" },
                    { value: "8", label: "8 Spaces" },
                  ]}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3">
          {/* Secondary Button Style if needed, for now just Close as Primary */}
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-5 py-1.5 bg-(--accent-color) hover:bg-(--accent-hover) text-white text-sm rounded-xs shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Component for consistency
// Helper Component for VS Code Style Checkbox
const Checkbox = ({
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
    className="flex items-start gap-3 p-1 hover:bg-(--bg-tertiary) rounded-xs transition-colors group cursor-pointer"
    onClick={() => onChange(!checked)}
  >
    <div
      className={`w-4 h-4 mt-0.5 border flex items-center justify-center transition-colors rounded-xs
        ${checked ? "bg-(--accent-color) border-(--accent-color)" : "bg-(--bg-input) border-(--border-color)"}
      `}
    >
      {checked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 h-3 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
    <div>
      <div className="text-sm text-(--text-primary) leading-tight">{label}</div>
      {description && (
        <div className="text-[11px] opacity-60 mt-0.5 leading-tight">
          {description}
        </div>
      )}
    </div>
  </div>
);

const CustomSelect = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className="w-full bg-(--bg-input) border border-(--border-color) text-(--text-primary) text-sm rounded-xs px-2 py-1 flex items-center justify-between cursor-pointer h-6.5 select-none focus:border-(--accent-color)"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 h-3 opacity-60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-(--bg-input) border border-(--border-color) rounded-xs shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                ${option.value === value ? "bg-(--accent-color) text-white" : "text-(--text-primary) hover:bg-(--accent-color) hover:text-white"}
              `}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
