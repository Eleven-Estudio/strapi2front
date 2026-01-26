import fs from "node:fs/promises";
import path from "node:path";

export interface TypeScriptInfo {
  enabled: boolean;
  configFile: string | null;
  version: string | null;
}

const TS_CONFIG_FILES = ["tsconfig.json", "tsconfig.app.json"];

export async function detectTypeScript(cwd: string = process.cwd()): Promise<TypeScriptInfo> {
  // Check for tsconfig
  for (const configFile of TS_CONFIG_FILES) {
    const configPath = path.join(cwd, configFile);
    try {
      await fs.access(configPath);

      // Check package.json for typescript version
      const pkgPath = path.join(cwd, "package.json");
      try {
        const pkgContent = await fs.readFile(pkgPath, "utf-8");
        const pkg = JSON.parse(pkgContent);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        return {
          enabled: true,
          configFile,
          version: deps.typescript || null,
        };
      } catch {
        return {
          enabled: true,
          configFile,
          version: null,
        };
      }
    } catch {
      // Config not found, continue
    }
  }

  return {
    enabled: false,
    configFile: null,
    version: null,
  };
}
