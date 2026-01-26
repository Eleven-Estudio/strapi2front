import fs from "node:fs/promises";
import path from "node:path";

export type Framework = "astro" | "nextjs" | "nuxt" | "unknown";

export interface FrameworkInfo {
  name: Framework;
  version: string | null;
  configFile: string | null;
}

const FRAMEWORK_DETECTORS: Record<
  string,
  { name: Framework; configFiles: string[] }
> = {
  astro: {
    name: "astro",
    configFiles: ["astro.config.mjs", "astro.config.ts", "astro.config.js"],
  },
  next: {
    name: "nextjs",
    configFiles: ["next.config.mjs", "next.config.ts", "next.config.js"],
  },
  nuxt: {
    name: "nuxt",
    configFiles: ["nuxt.config.ts", "nuxt.config.js"],
  },
};

export async function detectFramework(cwd: string = process.cwd()): Promise<FrameworkInfo> {
  // Read package.json to check dependencies
  const pkgPath = path.join(cwd, "package.json");

  try {
    const pkgContent = await fs.readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(pkgContent);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Check each framework
    for (const [pkgName, detector] of Object.entries(FRAMEWORK_DETECTORS)) {
      if (deps[pkgName]) {
        // Check for config file
        for (const configFile of detector.configFiles) {
          const configPath = path.join(cwd, configFile);
          try {
            await fs.access(configPath);
            return {
              name: detector.name,
              version: deps[pkgName],
              configFile,
            };
          } catch {
            // Config file not found, continue
          }
        }

        // Package found but no config file
        return {
          name: detector.name,
          version: deps[pkgName],
          configFile: null,
        };
      }
    }
  } catch {
    // package.json not found
  }

  return {
    name: "unknown",
    version: null,
    configFile: null,
  };
}

export function getFrameworkDisplayName(framework: Framework): string {
  const names: Record<Framework, string> = {
    astro: "Astro",
    nextjs: "Next.js",
    nuxt: "Nuxt",
    unknown: "Unknown",
  };
  return names[framework];
}
