import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { vol } from "memfs";
import { THEMES } from "../utils/themes";

interface EditorSettings {
  fontSize: number;
  tabSize: number;
  minimap: boolean;
  wordWrap: "on" | "off";
  lineNumbers: "on" | "off";
  theme: string;
  formatOnSave: boolean;
}

export interface LintMessage {
  ruleId: string | null;
  severity: number;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface LintResult {
  filePath: string;
  messages: LintMessage[];
  errorCount: number;
  warningCount: number;
}

interface EditorContextType {
  activeFile: string | null;
  setActiveFile: (path: string | null) => void;
  openFiles: string[];
  closeFile: (path: string) => void;
  files: string[];
  content: string;
  setContent: (content: string) => void;
  saveFile: () => void;
  createFile: (name: string) => void;
  deleteFile: (path: string) => void;
  fetchDirectory: (path: string) => Promise<void>;
  settings: EditorSettings;
  setSettings: (settings: Partial<EditorSettings>) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isTerminalOpen: boolean;
  setIsTerminalOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  workspace: string;
  setWorkspace: (path: string) => void;
  fetchFileContent: (path: string) => Promise<string>;
  formatFile: () => Promise<void>;
  lintResults: LintResult[];
  setLintResults: (results: LintResult[]) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [activeFile, setActiveFileState] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [content, setContent] = useState<string>("");

  const setActiveFile = (path: string | null) => {
    setActiveFileState(path);
    if (path && !openFiles.includes(path)) {
      setOpenFiles((prev) => [...prev, path]);
    }
  };

  const closeFile = (path: string) => {
    setOpenFiles((prev) => {
      const newOpenFiles = prev.filter((f) => f !== path);
      if (activeFile === path) {
        if (newOpenFiles.length > 0) {
          const lastFile = newOpenFiles[newOpenFiles.length - 1];
          setActiveFileState(lastFile || null);
        } else {
          setActiveFileState(null);
          setContent("");
        }
      }
      return newOpenFiles;
    });
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("is-sidebar-open");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("is-sidebar-open", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);
  const [settings, setSettingsState] = useState<EditorSettings>(() => {
    const saved = localStorage.getItem("editor-settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      fontSize: 14,
      tabSize: 2,
      minimap: true,
      wordWrap: "on",
      lineNumbers: "on",
      theme: "vs-dark",
      formatOnSave: true,
    };
  });

  const [workspace, setWorkspaceState] = useState<string>(() => {
    return localStorage.getItem("current-workspace") || "";
  });

  const [lintResults, setLintResults] = useState<LintResult[]>([]);

  const setSettings = (newSettings: Partial<EditorSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("editor-settings", JSON.stringify(updated));
      return updated;
    });
  };

  // Global Theme Management
  useEffect(() => {
    const targetTheme = THEMES[settings.theme] || THEMES["vscode-dark-plus"];
    const root = document.documentElement;

    Object.entries(targetTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Also update meta theme-color
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", targetTheme["--bg-secondary"]);
  }, [settings.theme]);

  // Global Font Size Management
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${settings.fontSize}px`;
  }, [settings.fontSize]);

  const setWorkspace = (path: string) => {
    setWorkspaceState(path);
    localStorage.setItem("current-workspace", path);
    window.location.reload();
  };

  const commonHeaders = {
    "x-workspace": workspace,
    "Content-Type": "application/json",
  };

  const refreshFiles = () => {
    const getAllFiles = (dir: string): string[] => {
      try {
        const entries = vol.readdirSync(dir, { withFileTypes: true }) as any[];
        let files: string[] = [];
        for (const entry of entries) {
          const fullPath = `${dir}${dir === "/" ? "" : "/"}${entry.name}`;
          if (entry.isDirectory()) {
            files.push(`${fullPath}/`);
            const children = getAllFiles(fullPath);
            files = [...files, ...children];
          } else {
            files.push(fullPath);
          }
        }
        return files;
      } catch (e) {
        return [];
      }
    };

    try {
      const list = getAllFiles("/");
      setFiles(list);
    } catch (e) {
      console.error("Refresh error", e);
    }
  };

  const fetchDirectory = async (dirPath: string) => {
    try {
      const cleanPath = dirPath.endsWith("/") ? dirPath.slice(0, -1) : dirPath;
      const res = await fetch(
        `/api/files/list?path=${encodeURIComponent(cleanPath || "/")}`,
        { headers: commonHeaders },
      );
      const items = await res.json();

      items.forEach((item: any) => {
        const p = item.path;
        if (item.isDirectory) {
          if (!vol.existsSync(p)) {
            vol.mkdirSync(p, { recursive: true });
          }
        } else {
          if (!vol.existsSync(p)) {
            vol.writeFileSync(p, "");
          }
        }
      });
      refreshFiles();
    } catch (e) {
      console.error("Failed to fetch directory", e);
    }
  };

  useEffect(() => {
    const initFs = async () => {
      try {
        vol.reset();

        // Fetch structure
        const [structRes, contentsRes] = await Promise.all([
          fetch(`/api/files/all-structure?t=${Date.now()}`, {
            headers: commonHeaders,
          }),
          fetch(`/api/files/all-code-contents?t=${Date.now()}`, {
            headers: commonHeaders,
          }),
        ]);

        if (!structRes.ok || !contentsRes.ok)
          throw new Error("Failed to fetch project data");

        const allPaths = await structRes.json();
        const allContents = await contentsRes.json();

        allPaths.forEach((pRaw: string) => {
          const p = pRaw.replace(/\\/g, "/");

          if (p.endsWith("/")) {
            vol.mkdirSync(p.slice(0, -1), { recursive: true });
          } else {
            const dir = p.split("/").slice(0, -1).join("/");
            if (dir && !vol.existsSync(dir)) {
              vol.mkdirSync(dir, { recursive: true });
            }
            const content = allContents[p] || "";
            vol.writeFileSync(p, content);
          }
        });

        refreshFiles();

        let fileToOpen = "/src/index.ts";
        if (!vol.existsSync(fileToOpen)) fileToOpen = "/src/index.tsx";
        if (!vol.existsSync(fileToOpen)) fileToOpen = "/index.ts";
        if (!vol.existsSync(fileToOpen)) fileToOpen = "/app.ts";
        if (!vol.existsSync(fileToOpen)) {
          const someFile = allPaths.find(
            (p: string) =>
              !p.endsWith("/") && (p.endsWith(".ts") || p.endsWith(".tsx")),
          );
          fileToOpen = someFile || "";
        }

        if (fileToOpen) {
          setActiveFile(fileToOpen);
        }
      } catch (e) {
        console.error("Failed to sync project structure", e);
      }
    };

    initFs();
  }, [workspace]);

  useEffect(() => {
    const handleOpenFile = (e: any) => {
      const path = e.detail;
      if (path && vol.existsSync(path)) {
        setActiveFile(path);
      }
    };
    document.addEventListener("editor-open-file", handleOpenFile);
    return () => {
      document.removeEventListener("editor-open-file", handleOpenFile);
    };
  }, [openFiles]);

  useEffect(() => {
    if (activeFile && !vol.statSync(activeFile).isDirectory()) {
      const loadContent = async () => {
        try {
          const currentData = vol.readFileSync(activeFile, "utf8");
          if (currentData === "") {
            const res = await fetch(
              `/api/files/content?path=${encodeURIComponent(activeFile)}`,
              { headers: commonHeaders },
            );
            const { content: serverContent } = await res.json();
            vol.writeFileSync(activeFile, serverContent);
            setContent(serverContent);
          } else {
            setContent(currentData as string);
          }
        } catch (e) {
          console.error("Failed to read file", e);
        }
      };
      loadContent();
    }
  }, [activeFile]);

  const saveFile = async () => {
    if (activeFile) {
      try {
        if (settings.formatOnSave) {
          await formatFile();
        }

        vol.writeFileSync(activeFile, content);

        await fetch("/api/files/save", {
          method: "POST",
          headers: commonHeaders,
          body: JSON.stringify({ path: activeFile, content }),
        });

        console.log(`Saved and synced ${activeFile}`);
      } catch (e) {
        console.error("Save failed", e);
      }
    }
  };

  const formatFile = async () => {
    if (!activeFile || !content) return;

    try {
      const prettier = await import("prettier/standalone");
      const plugins = [
        await import("prettier/plugins/typescript"),
        await import("prettier/plugins/estree"),
        await import("prettier/plugins/html"),
        await import("prettier/plugins/postcss"),
      ];

      const ext = activeFile.split(".").pop();
      let parser = "typescript";

      if (ext === "html") parser = "html";
      else if (ext === "css") parser = "css";
      else if (ext === "json") parser = "json";
      else if (ext === "js" || ext === "jsx") parser = "babel";

      const formatted = await prettier.format(content, {
        parser,
        plugins,
        semi: true,
        singleQuote: false,
        tabWidth: settings.tabSize,
      });

      if (formatted !== content) {
        setContent(formatted);
      }
    } catch (e) {
      console.error("Formatting failed", e);
    }
  };

  const createFile = (name: string) => {
    const path = name.startsWith("/") ? name : `/${name}`;
    vol.writeFileSync(path, "");
    refreshFiles();
    setActiveFile(path);
  };

  const deleteFile = (path: string) => {
    vol.unlinkSync(path);
    refreshFiles();
    if (activeFile === path) {
      setActiveFile(null);
      setContent("");
    }
  };

  const fetchFileContent = async (filePath: string): Promise<string> => {
    try {
      const currentData = vol.readFileSync(filePath, "utf8");
      if (currentData !== "") return currentData as string;

      const res = await fetch(
        `/api/files/content?path=${encodeURIComponent(filePath)}`,
        { headers: commonHeaders },
      );
      const { content: serverContent } = await res.json();
      vol.writeFileSync(filePath, serverContent);
      refreshFiles();
      return serverContent;
    } catch (e) {
      console.error("fetchFileContent failed", e);
      return "";
    }
  };

  return (
    <EditorContext.Provider
      value={{
        activeFile,
        setActiveFile,
        files,
        content,
        setContent,
        saveFile,
        createFile,
        deleteFile,
        fetchDirectory,
        settings,
        setSettings,
        isSettingsOpen,
        setIsSettingsOpen,
        isTerminalOpen,
        setIsTerminalOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        workspace,
        setWorkspace,
        fetchFileContent,
        formatFile,
        lintResults,
        setLintResults,
        openFiles,
        closeFile,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
};
