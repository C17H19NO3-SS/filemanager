import Elysia, { t } from "elysia";
import fs from "node:fs/promises";
import path from "node:path";

const getWorkspaceRoot = (headers: Record<string, string | undefined>) => {
  const ws = headers["x-workspace"];
  const root = path.resolve(ws || process.cwd()).replace(/\\/g, "/");
  return root;
};

const safeJoin = (root: string, relPath: string) => {
  const cleanPath = relPath.startsWith("/") ? relPath.slice(1) : relPath;
  const joined = path.resolve(root, cleanPath).replace(/\\/g, "/");

  // Case-insensitive check for Windows stability
  if (!joined.toLowerCase().startsWith(root.toLowerCase())) {
    throw new Error("Unauthorized path access outside workspace root");
  }
  return joined;
};

export const fileManagerEndpoint = new Elysia({ prefix: "/api/files" })
  .get(
    "/list",
    async ({ query, headers }) => {
      const { path: reqPath = "/" } = query;
      const rootDir = getWorkspaceRoot(headers);
      const targetDir = safeJoin(rootDir, reqPath as string);

      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      const results = [];

      for (const entry of entries) {
        if (entry.name === ".git") continue;

        const fullPath = path.join(targetDir, entry.name);
        const relativePath =
          "/" + path.relative(rootDir, fullPath).replace(/\\/g, "/");

        results.push({
          name: entry.name,
          path: relativePath,
          isDirectory: entry.isDirectory(),
          size: entry.isFile() ? (await fs.stat(fullPath)).size : 0,
        });
      }

      return results;
    },
    {
      query: t.Object({
        path: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/content",
    async ({ query, headers }) => {
      const { path: filePath } = query;
      const rootDir = getWorkspaceRoot(headers);
      const fullPath = safeJoin(rootDir, filePath as string);

      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        throw new Error("Cannot get content of a directory");
      }

      const content = await fs.readFile(fullPath, "utf8");
      return { content };
    },
    {
      query: t.Object({
        path: t.String(),
      }),
    },
  )
  .get("/all-structure", async ({ headers }) => {
    // Helper to get full structure but without content (except for very small files if needed)
    // Actually, let's just make it return the full tree of PATHS.
    const rootDir = getWorkspaceRoot(headers);
    async function getPaths(dir: string): Promise<string[]> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      let paths: string[] = [];
      for (const entry of entries) {
        if (entry.name === ".git" || entry.name === "node_modules") continue;
        const fullPath = path.join(dir, entry.name);
        const relPath =
          "/" + path.relative(rootDir, fullPath).replace(/\\/g, "/");
        if (entry.isDirectory()) {
          paths.push(relPath + "/");
          paths = [...paths, ...(await getPaths(fullPath))];
        } else {
          paths.push(relPath);
        }
      }
      return paths;
    }
    return await getPaths(rootDir);
  })
  .get("/all-code-contents", async ({ headers }) => {
    const rootDir = getWorkspaceRoot(headers);
    const results: Record<string, string> = {};
    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === ".git" || entry.name === "node_modules") continue;
        const fullPath = path.join(dir, entry.name);
        const relPath =
          "/" + path.relative(rootDir, fullPath).replace(/\\/g, "/");
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (/\.(ts|js|tsx|jsx|json)$/.test(entry.name)) {
          try {
            results[relPath] = await fs.readFile(fullPath, "utf8");
          } catch (e) {}
        }
      }
    }
    await scan(rootDir);
    return results;
  })
  .post(
    "/save",
    async ({ body, headers }) => {
      const { path: filePath, content } = body;
      const rootDir = getWorkspaceRoot(headers);
      const fullPath = safeJoin(rootDir, filePath);

      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf8");
      return { success: true };
    },
    {
      body: t.Object({
        path: t.String(),
        content: t.String(),
      }),
    },
  )
  .post(
    "/node-types",
    async ({ body, headers }) => {
      const { packages } = body;
      const results: Record<string, string> = {};
      const rootDir = getWorkspaceRoot(headers);
      const seen = new Set<string>();

      async function scanTypes(dir: string) {
        if (!(await fs.stat(dir).catch(() => null))?.isDirectory()) return;

        const entries = await fs.readdir(dir, { withFileTypes: true });
        const nodeModulesPath = path
          .resolve(rootDir, "node_modules")
          .replace(/\\/g, "/");

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name).replace(/\\/g, "/");
          const relPath = path
            .relative(nodeModulesPath, fullPath)
            .replace(/\\/g, "/");

          if (entry.isDirectory()) {
            if (
              entry.name === "docs" ||
              entry.name === "examples" ||
              entry.name === "test" ||
              entry.name === "__tests__"
            )
              continue;
            await scanTypes(fullPath);
          } else if (
            entry.name.endsWith(".d.ts") ||
            entry.name.endsWith(".d.cts") ||
            entry.name.endsWith(".d.mts")
          ) {
            try {
              const content = await fs.readFile(fullPath, "utf8");
              results[relPath] = content;
            } catch (e) {}
          } else if (entry.name === "package.json") {
            try {
              const content = await fs.readFile(fullPath, "utf8");
              const pkg = JSON.parse(content);
              // Send minimized package.json to frontend to allow correct type resolution
              // (e.g. "types": "lib/index.d.ts") without bloating the payload
              const minPkg = {
                name: pkg.name,
                types: pkg.types,
                typings: pkg.typings,
                main: pkg.main,
                module: pkg.module,
                exports: pkg.exports,
              };
              results[relPath] = JSON.stringify(minPkg);
            } catch (e) {}
          }
        }
      }

      async function resolvePackage(pkg: string) {
        if (
          !pkg ||
          seen.has(pkg) ||
          pkg.startsWith(".") ||
          pkg.startsWith("@/")
        )
          return;
        seen.add(pkg);

        const pathsToCheck: string[] = [];
        const nodeModulesPath = path.resolve(rootDir, "node_modules");

        // 1. Check the package itself (e.g. node_modules/express)
        pathsToCheck.push(path.join(nodeModulesPath, pkg));

        // 2. Check @types for it (e.g. node_modules/@types/express)
        if (!pkg.startsWith("@types/")) {
          const typesName = pkg.startsWith("@")
            ? pkg.slice(1).replace(/\//g, "__")
            : pkg;
          pathsToCheck.push(path.join(nodeModulesPath, "@types", typesName));
        }

        for (const p of pathsToCheck) {
          // Verify existence first and avoid errors
          if (!(await fs.stat(p).catch(() => null))?.isDirectory()) continue;

          await scanTypes(p);

          try {
            const pjPath = path.join(p, "package.json");
            const pjContent = await fs.readFile(pjPath, "utf8");
            const pj = JSON.parse(pjContent);

            // Recursively resolve dependencies.
            // Crucially, this finds deps of @types/express too.
            const deps = {
              ...(pj.dependencies || {}),
              ...(pj.peerDependencies || {}),
              // Filter out devDependencies to prevent huge recursion bloom,
              // except for the initial root call (which is handled outside this function)
            };

            for (const dep of Object.keys(deps)) {
              await resolvePackage(dep);
            }
          } catch (e) {}
        }
      }

      const scanPkgs = [...new Set([...packages, "@types/node"])];
      for (const pkg of scanPkgs) {
        await resolvePackage(pkg);
      }

      return results;
    },
    {
      body: t.Object({
        packages: t.Array(t.String()),
      }),
    },
  )
  .get(
    "/browse-directories",
    async ({ query }) => {
      const { path: reqPath = process.cwd() } = query;
      const targetDir = path.isAbsolute(reqPath as string)
        ? (reqPath as string)
        : path.join(process.cwd(), reqPath as string);

      try {
        const entries = await fs.readdir(targetDir, { withFileTypes: true });
        const directories = [];

        for (const entry of entries) {
          if (entry.isDirectory()) {
            directories.push({
              name: entry.name,
              path: path.join(targetDir, entry.name).replace(/\\/g, "/"),
            });
          }
        }

        return {
          currentPath: targetDir.replace(/\\/g, "/"),
          parentPath: path.dirname(targetDir).replace(/\\/g, "/"),
          directories: directories.sort((a, b) => a.name.localeCompare(b.name)),
        };
      } catch (e) {
        throw new Error(`Failed to read directory: ${e}`);
      }
    },
    {
      query: t.Object({
        path: t.Optional(t.String()),
      }),
    },
  );
