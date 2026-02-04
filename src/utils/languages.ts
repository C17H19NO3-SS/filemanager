export const getLanguageByExtension = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();

  const map: Record<string, string> = {
    // Web
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    scss: "scss",
    less: "less",
    json: "json",
    svg: "xml",

    // Programming Languages
    py: "python",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    rb: "ruby",
    php: "php",
    rs: "rust",
    swift: "swift",
    kt: "kotlin",
    dart: "dart",
    sh: "shell",
    pl: "perl",
    lua: "lua",
    r: "r",
    scala: "scala",
    sql: "sql",

    // Config & Data
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    toml: "toml",
    md: "markdown",
    ini: "ini",
    dockerfile: "dockerfile",
    makefile: "makefile",

    // Web Frameworks & Others
    vue: "vue",
    svelte: "svelte",
    graphql: "graphql",
    gql: "graphql",
    astro: "astro",

    // Extensions mapping for Monaco
    mjs: "javascript",
    cjs: "javascript",
    cts: "typescript",
    mts: "typescript",
    h: "c",
    hpp: "cpp",
  };

  if (!ext) return "plaintext";
  return map[ext] || "plaintext";
};
