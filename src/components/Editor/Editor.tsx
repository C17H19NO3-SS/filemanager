import React, { useRef, useEffect } from "react";
import Monaco, { type OnMount } from "@monaco-editor/react";
import { useEditor } from "@/providers/EditorProvider";
import { getLanguageByExtension } from "@/utils/languages";
import { vol } from "memfs";
import { TAILWIND_CLASSES } from "../../utils/tailwind-classes";
import { THEMES, THEME_RULES } from "../../utils/themes";

export const Editor = () => {
  const {
    content,
    setContent,
    activeFile,
    files,
    settings,
    workspace,
    fetchFileContent,
    saveFile,
    formatFile,
    setLintResults,
  } = useEditor();

  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const loadedPackages = useRef<Set<string>>(new Set());
  const debounceTimer = useRef<any>(null);

  const loadNodeTypes = async (packages: string[]) => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    const newPackages = packages.filter(
      (p) =>
        p &&
        !loadedPackages.current.has(p) &&
        !p.startsWith(".") &&
        !p.startsWith("@/"),
    );
    if (newPackages.length === 0) return;

    newPackages.forEach((p) => loadedPackages.current.add(p));

    try {
      const res = await fetch("/api/files/node-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace": workspace,
        },
        body: JSON.stringify({ packages: newPackages }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const typeDefinitions = await res.json();
      console.log(
        `Loaded ${Object.keys(typeDefinitions).length} type files for packages: ${newPackages.join(", ")}`,
      );

      const entryPoints: string[] = [];

      Object.entries(typeDefinitions).forEach(([path, content]) => {
        const typeUri = `file:///node_modules/${path}`;

        // If it's a package.json, we use it to find the entry point
        if (path.endsWith("package.json")) {
          try {
            const parts = path.split("/");
            const dirParts = path.startsWith("@")
              ? [parts[0], parts[1]]
              : [parts[0]];
            const actualDir = dirParts.filter(Boolean).join("/");

            let moduleName = actualDir;
            if (moduleName.startsWith("@types/")) {
              moduleName = moduleName.replace("@types/", "");
              if (moduleName.includes("__")) {
                moduleName = "@" + moduleName.replace("__", "/");
              }
            }

            const pj = JSON.parse(content as string);
            let typesFile = pj.types || pj.typings;

            // Handle modern 'exports' field if types is missing
            if (!typesFile && pj.exports) {
              const findTypes = (obj: any): string | null => {
                if (typeof obj === "string" && obj.endsWith(".d.ts"))
                  return obj;
                if (typeof obj === "object" && obj !== null) {
                  if (obj.types) return obj.types;
                  for (const v of Object.values(obj)) {
                    const found = findTypes(v);
                    if (found) return found;
                  }
                }
                return null;
              };
              typesFile = findTypes(pj.exports);
            }

            if (typesFile) {
              const cleanTypes = typesFile.replace(/^\.\//, "");
              const fullPath = `file:///node_modules/${actualDir}/${cleanTypes}`;
              entryPoints.push(
                `declare module "${moduleName}" {
                  import m = require("${fullPath}");
                  export = m;
                }
                declare module "${moduleName}" {
                  export * from "${fullPath}";
                }`,
              );
            } else if (
              Object.keys(typeDefinitions).some((k) =>
                k.startsWith(`${actualDir}/index.d.ts`),
              )
            ) {
              const fullPath = `file:///node_modules/${actualDir}/index.d.ts`;
              entryPoints.push(
                `declare module "${moduleName}" {
                  import m = require("${fullPath}");
                  export = m;
                }
                declare module "${moduleName}" {
                  export * from "${fullPath}";
                }`,
              );
            }
          } catch (e) {}
        }

        try {
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            content as string,
            typeUri,
          );
          monaco.languages.typescript.javascriptDefaults.addExtraLib(
            content as string,
            typeUri,
          );
        } catch (e) {
          console.warn(`Failed to add extra lib: ${typeUri}`, e);
        }
      });

      if (entryPoints.length > 0) {
        const entryUri = `file:///internal/entrypoints-${Date.now()}.d.ts`;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          entryPoints.join("\n"),
          entryUri,
        );
        monaco.languages.typescript.javascriptDefaults.addExtraLib(
          entryPoints.join("\n"),
          entryUri,
        );
      }
    } catch (e) {
      console.error("Failed to load node types", e);
    }
  };

  const resolveLocalPath = (importPath: string, currentFile: string) => {
    if (!importPath.startsWith(".") && !importPath.startsWith("@/"))
      return null;

    let targetPath = "";

    if (importPath.startsWith("@/")) {
      targetPath = importPath.replace("@/", "/src/");
    } else {
      // Handle relative paths like ./foo or ../foo
      const currentDir = currentFile.split("/").slice(0, -1).join("/");
      const parts = importPath.split("/");
      const stack = currentDir.split("/").filter(Boolean);

      for (const p of parts) {
        if (p === ".") continue;
        if (p === "..") {
          stack.pop();
        } else {
          stack.push(p);
        }
      }
      targetPath = "/" + stack.join("/");
    }

    // Try exact match first, then extensions
    const candidates = [
      targetPath,
      targetPath + ".ts",
      targetPath + ".tsx",
      targetPath + ".d.ts",
      targetPath + "/index.ts",
      targetPath + "/index.tsx",
      targetPath + "/index.d.ts",
    ];

    for (const cand of candidates) {
      if (files.includes(cand)) return cand;
    }

    return null;
  };

  const scanAndLoadTypes = (code: string) => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      // Improved regex to catch all types of imports/requires
      const importRegex =
        /(?:import|from|require)\s*\(\s*['"]([^'"]+)['"]\s*\)|(?:import|from|export\s+.*\s+from)\s+['"]([^'"]+)['"]/g;
      const packages: string[] = [];
      const localPaths: string[] = [];
      let match;
      while ((match = importRegex.exec(code)) !== null) {
        const pkg = match[1] || match[2];
        if (pkg) {
          if (pkg.startsWith(".") || pkg.startsWith("@/")) {
            if (activeFile) {
              const resolved = resolveLocalPath(pkg, activeFile);
              if (resolved && !resolved.endsWith("/"))
                localPaths.push(resolved);
            }
          } else {
            // It's a node module or an absolute-ish import
            const parts = pkg.split("/");
            if (pkg.startsWith("@") && parts.length >= 2) {
              packages.push(`${parts[0]}/${parts[1]}`);
            } else {
              const rootPkg = parts[0] || "";
              if (rootPkg) packages.push(rootPkg);
            }
          }
        }
      }

      if (packages.length > 0) {
        loadNodeTypes([...new Set(packages)]);
      }

      const uniqueLocals = [...new Set(localPaths)];
      uniqueLocals.forEach((p) => fetchFileContent(p));
    }, 800);
  };

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || !files) return;

    files.forEach((path) => {
      try {
        const fileContent = vol.readFileSync(path, "utf8") as string;
        // Ensure path starts with slash for consistency
        const safePath = path.startsWith("/") ? path : "/" + path;
        const uri = monaco.Uri.from({ scheme: "file", path: safePath });

        const language = getLanguageByExtension(path) || "plaintext";

        let model = monaco.editor.getModel(uri);
        if (model) {
          const currentLang = model.getLanguageId();
          if (currentLang !== language) {
            monaco.editor.setModelLanguage(model, language);
          }

          if (fileContent !== "" && model.getValue() !== fileContent) {
            model.setValue(fileContent);
          }
        } else {
          model = monaco.editor.createModel(fileContent, language, uri);
        }

        if (
          fileContent !== "" &&
          (path.endsWith(".ts") ||
            path.endsWith(".tsx") ||
            path.endsWith(".d.ts"))
        ) {
          scanAndLoadTypes(fileContent);
        }
      } catch (e) {}
    });
  }, [files, monacoRef.current]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
    editorRef.current = editor;

    // Define VS Code Dark+ Theme
    monaco.editor.defineTheme("vscode-dark-plus", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "D4D4D4" },
        { token: "comment", foreground: "6A9955" },
        { token: "string", foreground: "CE9178" },
        { token: "constant.numeric", foreground: "B5CEA8" },
        { token: "constant.language", foreground: "569CD6" },
        { token: "keyword", foreground: "C586C0" },
        { token: "keyword.control", foreground: "C586C0" },
        { token: "operator", foreground: "D4D4D4" },
        { token: "storage", foreground: "569CD6" },
        { token: "storage.type", foreground: "569CD6" },

        // Semantic Token Overrides
        { token: "function", foreground: "DCDCAA" },
        { token: "method", foreground: "DCDCAA" },
        { token: "class", foreground: "4EC9B0" },
        { token: "interface", foreground: "4EC9B0" },
        { token: "struct", foreground: "4EC9B0" },
        { token: "enum", foreground: "4EC9B0" },
        { token: "type", foreground: "4EC9B0" },
        { token: "typeParameter", foreground: "4EC9B0" },
        { token: "variable", foreground: "9CDCFE" },
        { token: "parameter", foreground: "9CDCFE" },
        { token: "property", foreground: "9CDCFE" },
        { token: "member", foreground: "9CDCFE" },
        { token: "namespace", foreground: "4EC9B0" },

        // TextMate fallback rules
        { token: "entity.name.function", foreground: "DCDCAA" },
        { token: "entity.name.type", foreground: "4EC9B0" },
        { token: "entity.name.tag", foreground: "569CD6" },
        { token: "entity.other.attribute-name", foreground: "9CDCFE" },
        { token: "support.function", foreground: "DCDCAA" },
        { token: "support.constant", foreground: "4EC9B0" },
        { token: "support.type", foreground: "4EC9B0" },
        { token: "support.class", foreground: "4EC9B0" },
        { token: "meta.tag", foreground: "808080" },
        { token: "meta.tag.attribute.name", foreground: "9CDCFE" },
        { token: "meta.tag.attribute.value", foreground: "CE9178" },
        { token: "identifier", foreground: "9CDCFE" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#2F3337",
        "editorCursor.foreground": "#AEAFAD",
        "editorWhitespace.foreground": "#3B3A32",
        "editorIndentGuide.background": "#404040",
        "editorIndentGuide.activeBackground": "#707070",
        "editor.selectionBackground": "#264F78",
        "editor.inactiveSelectionBackground": "#3A3D41",
      },
    });

    // Register all themes from THEMES util
    Object.entries(THEMES).forEach(([themeKey, themeColors]) => {
      if (themeKey === "vscode-dark-plus") return; // Handled specially below/above

      const isLight = themeKey.includes("light");
      const customRules = THEME_RULES[themeKey] || [];

      monaco.editor.defineTheme(themeKey, {
        base: isLight ? "vs" : "vs-dark",
        inherit: true,
        rules: customRules, // Apply custom syntax highlighting rules
        colors: {
          "editor.background": themeColors["--bg-primary"],
          "editor.foreground": themeColors["--text-primary"],
          "editor.lineHighlightBackground": themeColors["--bg-secondary"],
          "editor.selectionBackground": themeColors["--selection-color"],
          "editorCursor.foreground": themeColors["--text-primary"],
          "editorIndentGuide.background": themeColors["--border-color"],
          "editorIndentGuide.activeBackground": themeColors["--text-secondary"],
        },
      });
    });

    const themeToUse =
      settings.theme in THEMES
        ? settings.theme
        : settings.theme.includes("light")
          ? "vs-light"
          : "vs-dark";

    monaco.editor.setTheme(themeToUse);

    // Inject custom CSS for our manual function highlighter
    const style = document.createElement("style");
    style.innerHTML = `
      .token-custom-function {
        color: #DCDCAA !important;
      }
    `;
    document.head.appendChild(style);

    // Override the editor service to handle "Go to Definition" locally
    const editorService = (editor as any)._codeEditorService;
    const openEditorBase = editorService.openCodeEditor;
    editorService.openCodeEditor = async (
      input: any,
      source: any,
      sideBySide: any,
    ) => {
      const result = await openEditorBase.call(
        editorService,
        input,
        source,
        sideBySide,
      );
      if (input.resource) {
        const path = input.resource.path;
        if (path.startsWith("/")) {
          // It's a local file, switch to it
          document.dispatchEvent(
            new CustomEvent("editor-open-file", { detail: path }),
          );
        }
      }
      return result;
    };
    const updateMarkers = () => {
      const markers = monaco.editor.getModelMarkers({});
      const resultsMap: Record<string, any> = {};

      markers.forEach((m: any) => {
        const filePath = m.resource.path;
        if (!resultsMap[filePath]) {
          resultsMap[filePath] = {
            filePath,
            messages: [],
            errorCount: 0,
            warningCount: 0,
          };
        }

        const msg = {
          ruleId: m.code
            ? typeof m.code === "string"
              ? m.code
              : m.code.value
            : "TS",
          severity: m.severity === 8 ? 2 : 1,
          message: m.message,
          line: m.startLineNumber,
          column: m.startColumn,
          endLine: m.endLineNumber,
          endColumn: m.endColumn,
        };

        resultsMap[filePath].messages.push(msg);
        if (msg.severity === 2) resultsMap[filePath].errorCount++;
        else resultsMap[filePath].warningCount++;
      });

      setLintResults(Object.values(resultsMap));
    };

    const runFullAudit = async () => {
      const monaco = monacoRef.current;
      if (!monaco) return;

      try {
        const getWorker =
          await monaco.languages.typescript.getTypeScriptWorker();
        const models = monaco.editor.getModels();

        // Trigger validation for all TS/JS models
        for (const model of models) {
          const lang = model.getLanguageId();
          if (
            lang === "typescript" ||
            lang === "typescriptreact" ||
            lang === "javascript" ||
            lang === "javascriptreact"
          ) {
            const worker = await getWorker(model.uri);
            // Requesting diagnostics forces the worker to validate the model
            await worker.getSemanticDiagnostics(model.uri.toString());
            await worker.getSyntacticDiagnostics(model.uri.toString());
          }
        }
        updateMarkers();
      } catch (e) {
        console.warn("Full audit failed", e);
        updateMarkers();
      }
    };

    monaco.editor.onDidChangeMarkers(updateMarkers);
    updateMarkers();

    // Manual Function Highlighter (Regex-based fallback)
    // This guarantees that "method()" calls are yellow, even if semantic tokens fail.
    const customDecorations = editor.createDecorationsCollection([]);
    const updateCustomDecorations = () => {
      const model = editor.getModel();
      if (!model) return;

      const code = model.getValue();
      const newDecorations: any[] = [];
      // Regex to find identifier followed by '(':  word  (
      const regex = /\b([a-zA-Z_$][\w$]*)\s*(?=\()/g;

      const keywords = new Set([
        "if",
        "for",
        "while",
        "switch",
        "catch",
        "return",
        "await",
        "function",
        "class",
        "super",
        "constructor",
      ]);

      let match;
      while ((match = regex.exec(code)) !== null) {
        const word = match[1];
        if (keywords.has(word)) continue; // Skip keywords like if(...)

        const startPos = model.getPositionAt(match.index);
        const endPos = model.getPositionAt(match.index + word.length);

        newDecorations.push({
          range: new monaco.Range(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column,
          ),
          options: {
            inlineClassName: "token-custom-function",
          },
        });
      }

      customDecorations.set(newDecorations);
    };

    let isUpdatingTags = false;
    editor.onDidChangeModelContent((e) => {
      // Run custom highlighter
      updateCustomDecorations();

      if (isUpdatingTags) return;
      const model = editor.getModel();
      if (!model) return;

      const language = model.getLanguageId();
      if (
        language !== "html" &&
        language !== "typescriptreact" &&
        language !== "javascriptreact" &&
        language !== "typescript" &&
        language !== "javascript"
      )
        return;

      e.changes.forEach((change) => {
        const value = change.text;
        // Simple heuristic for tag renaming
        if (/[a-zA-Z0-9]/.test(value) || value === "") {
          const line = model.getLineContent(change.range.startLineNumber);
          const lineText =
            line.substring(0, change.range.startColumn - 1) +
            value +
            line.substring(change.range.endColumn - 1);

          // Check if we are inside a tag name
          const tagMatch = line.match(/<(\/?[a-zA-Z0-9]+)/);
          if (tagMatch) {
            // Logic for tag rename if needed
          }
        }
      });

      scanAndLoadTypes(editor.getValue());

      // Debounced full audit on change
      clearTimeout(auditTimeout);
      auditTimeout = setTimeout(() => {
        runFullAudit();
      }, 1500);
    });

    let auditTimeout: any;

    // Keyboard Shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      document.dispatchEvent(new CustomEvent("editor-save"));
    });

    editor.addCommand(
      monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        document.dispatchEvent(new CustomEvent("editor-format"));
      },
    );

    document.addEventListener("editor-audit", () => {
      runFullAudit();
    });

    // Unified Config for TS and JS
    const compilerOptions = {
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      jsxImportSource: "react",
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: true,
      typeRoots: ["file:///node_modules/@types", "file:///node_modules"],
      baseUrl: "file:///",
      paths: {
        "@/*": ["file:///src/*"],
      },
      lib: ["ESNext", "DOM", "DOM.Iterable"],
      skipLibCheck: true,
      resolveJsonModule: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
    };

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
      compilerOptions,
    );
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
      compilerOptions,
    );

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Enforce semantic tokens
    monaco.languages.typescript.typescriptDefaults.setModeConfiguration({
      ...monaco.languages.typescript.typescriptDefaults.modeConfiguration,
      semanticTokens: true,
    });
    monaco.languages.typescript.javascriptDefaults.setModeConfiguration({
      ...monaco.languages.typescript.javascriptDefaults.modeConfiguration,
      semanticTokens: true,
    });

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare module "*.html" { const content: string; export default content; }
      declare module "*.css" { const classes: any; export default classes; }
      declare module "*.svg" { const path: string; export default path; }
      
      // Global React support for JSX without imports
      import * as ReactNamespace from 'react';
      export = ReactNamespace;
      export as namespace React;
    `,
      "file:///internal/env.d.ts",
    );

    const initialPackages = [
      "elysia",
      "@elysiajs/swagger",
      "react",
      "react-dom",
      "@types/node",
      "express",
      "@types/express",
      "cookie-parser",
      "express-session",
      "dotenv",
      "express-rate-limit",
      "@types/express-rate-limit",
      "helmet",
      "cors",
      "express-ejs-layouts",
      "lucide-react",
      "@types/react",
      "@types/react-dom",
      "framer-motion",
    ];

    try {
      const pjData = vol.readFileSync("/package.json", "utf8") as string;
      const pj = JSON.parse(pjData);
      const allDeps = [
        ...Object.keys(pj.dependencies || {}),
        ...Object.keys(pj.devDependencies || {}),
      ];
      allDeps.forEach((d) => initialPackages.push(d));
    } catch (e) {}

    loadNodeTypes([...new Set(initialPackages)]);
    scanAndLoadTypes(editor.getValue());

    // Register Tailwind Completion Provider
    const tailwindProvider = monaco.languages.registerCompletionItemProvider(
      ["html", "javascript", "typescript"],
      {
        triggerCharacters: ['"', "'", " ", "-"],
        provideCompletionItems: (model: any, position: any) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          // Match class="..." or className="..."
          const classNameRegex = /(?:class|className)=["']([^"']*)$/;
          const match = textUntilPosition.match(classNameRegex);

          if (!match) return { suggestions: [] };

          const currentWordMatch = textUntilPosition.match(/[\w-]*$/);
          const currentWord = currentWordMatch ? currentWordMatch[0] : "";

          const suggestions = TAILWIND_CLASSES.map((cls) => {
            // Very simple color preview for known colors
            let colorPreview = "";
            if (cls.includes("red-")) colorPreview = "🔴 ";
            if (cls.includes("blue-")) colorPreview = "🔵 ";
            if (cls.includes("green-")) colorPreview = "🟢 ";
            if (cls.includes("yellow-")) colorPreview = "🟡 ";
            if (cls.includes("purple-")) colorPreview = "🟣 ";
            if (cls.includes("gray-")) colorPreview = "⚪ ";

            return {
              label: cls,
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: cls,
              detail: cls.endsWith(":")
                ? "Tailwind Variant"
                : "Tailwind Utility",
              documentation: `Tailwind CSS: ${colorPreview}${cls}`,
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column - currentWord.length,
                endColumn: position.column,
              },
            };
          });

          return { suggestions };
        },
      },
    );

    return () => {
      tailwindProvider.dispose();
    };
  };

  // Register React Snippets
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    const snippetsProvider = monaco.languages.registerCompletionItemProvider(
      ["typescriptreact", "javascriptreact"],
      {
        provideCompletionItems: () => {
          const suggestions = [
            {
              label: "rfc",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                "import React from 'react';",
                "",
                "export const ${1:ComponentName} = () => {",
                "  return (",
                "    <div>",
                "      ${0}",
                "    </div>",
                "  );",
                "};",
              ].join("\n"),
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: "React Functional Component",
            },
            {
              label: "useS",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText:
                "const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: "React useState hook",
            },
            {
              label: "useE",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: ["useEffect(() => {", "  ${1}", "}, [${2}]);"].join(
                "\n",
              ),
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: "React useEffect hook",
            },
          ];
          return { suggestions };
        },
      },
    );

    return () => snippetsProvider.dispose();
  }, [monacoRef.current]);

  // Listen for theme changes to update Editor instantly
  useEffect(() => {
    if (monacoRef.current) {
      const themeToUse =
        settings.theme in THEMES
          ? settings.theme
          : settings.theme.includes("light")
            ? "vs-light"
            : "vs-dark";
      monacoRef.current.editor.setTheme(themeToUse);
    }
  }, [settings.theme]);

  // Global Shortcut Handlers
  useEffect(() => {
    const handleSave = () => saveFile();
    const handleFormat = () => formatFile();

    document.addEventListener("editor-save", handleSave);
    document.addEventListener("editor-format", handleFormat);
    return () => {
      document.removeEventListener("editor-save", handleSave);
      document.removeEventListener("editor-format", handleFormat);
    };
  }, [activeFile, content]);

  // Scan types when active file changes
  useEffect(() => {
    if (activeFile && content) {
      scanAndLoadTypes(content);
    }
  }, [activeFile]);

  return (
    <div className="h-full w-full">
      <Monaco
        path={activeFile || undefined}
        language={activeFile ? getLanguageByExtension(activeFile) : "plaintext"}
        value={content}
        onChange={(value) => setContent(value || "")}
        onMount={handleEditorDidMount}
        theme="vscode-dark-plus"
        height="100%"
        options={{
          minimap: {
            enabled: settings.minimap,
          },
          fontSize: settings.fontSize,
          tabSize: settings.tabSize,
          wordWrap: settings.wordWrap,
          lineNumbers: settings.lineNumbers,
          padding: { top: 16 },
          fontFamily: "'Consolas', 'Courier New', monospace",
          automaticLayout: true,
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          formatOnPaste: true,
          formatOnType: true,
          // @ts-ignore
          "semanticHighlighting.enabled": true,
        }}
      />
    </div>
  );
};
