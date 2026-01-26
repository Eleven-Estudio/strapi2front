import fs from "node:fs/promises";
import path from "node:path";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export interface PackageManagerInfo {
  name: PackageManager;
  lockFile: string | null;
}

const LOCK_FILES: Record<string, PackageManager> = {
  "pnpm-lock.yaml": "pnpm",
  "package-lock.json": "npm",
  "yarn.lock": "yarn",
  "bun.lockb": "bun",
};

export async function detectPackageManager(cwd: string = process.cwd()): Promise<PackageManagerInfo> {
  // Check for lock files
  for (const [lockFile, pm] of Object.entries(LOCK_FILES)) {
    const lockPath = path.join(cwd, lockFile);
    try {
      await fs.access(lockPath);
      return {
        name: pm,
        lockFile,
      };
    } catch {
      // Lock file not found, continue
    }
  }

  // Default to npm if no lock file found
  return {
    name: "npm",
    lockFile: null,
  };
}

export function getInstallCommand(pm: PackageManager, pkg: string): string {
  const commands: Record<PackageManager, string> = {
    pnpm: `pnpm add ${pkg}`,
    npm: `npm install ${pkg}`,
    yarn: `yarn add ${pkg}`,
    bun: `bun add ${pkg}`,
  };
  return commands[pm];
}

export function getRunCommand(pm: PackageManager, script: string): string {
  const commands: Record<PackageManager, string> = {
    pnpm: `pnpm ${script}`,
    npm: `npm run ${script}`,
    yarn: `yarn ${script}`,
    bun: `bun run ${script}`,
  };
  return commands[pm];
}
