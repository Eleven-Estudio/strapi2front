import fs from "node:fs/promises";
import path from "node:path";

export type ModuleType = "esm" | "commonjs";

export interface ModuleTypeInfo {
  type: ModuleType;
  reason: string;
}

/**
 * Detect if the project uses ES Modules or CommonJS
 *
 * Detection order:
 * 1. Check package.json "type" field
 * 2. Check for .mjs config files (next.config.mjs, etc.)
 * 3. Default to CommonJS
 */
export async function detectModuleType(cwd: string = process.cwd()): Promise<ModuleTypeInfo> {
  // Check package.json "type" field
  try {
    const packageJsonPath = path.join(cwd, "package.json");
    const content = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);

    if (packageJson.type === "module") {
      return { type: "esm", reason: 'package.json has "type": "module"' };
    }

    if (packageJson.type === "commonjs") {
      return { type: "commonjs", reason: 'package.json has "type": "commonjs"' };
    }
  } catch {
    // package.json not found or invalid
  }

  // Check for .mjs config files (indicates ESM preference)
  const esmIndicators = [
    "next.config.mjs",
    "nuxt.config.mjs",
    "vite.config.mjs",
    "astro.config.mjs",
  ];

  for (const file of esmIndicators) {
    try {
      await fs.access(path.join(cwd, file));
      return { type: "esm", reason: `Found ${file} (ESM config file)` };
    } catch {
      // File doesn't exist
    }
  }

  // Default to CommonJS (Node.js default)
  return { type: "commonjs", reason: "Default (no ESM indicators found)" };
}
