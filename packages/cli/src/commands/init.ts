import * as p from "@clack/prompts";
import pc from "picocolors";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { detectFramework } from "../lib/detectors/framework.js";
import { detectTypeScript } from "../lib/detectors/typescript.js";
import { detectPackageManager, getInstallCommand, getInstallDevCommand } from "../lib/detectors/package-manager.js";
import { detectModuleType } from "../lib/detectors/module-type.js";
import { runInitPrompts } from "../lib/prompts/init.prompts.js";
import { logger } from "../lib/utils/logger.js";

/**
 * Execute a shell command asynchronously
 * This allows spinners to animate while the command runs
 */
function execAsync(command: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(" ");
    const child = spawn(cmd, args, {
      cwd,
      stdio: "ignore",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

export interface InitCommandOptions {
  yes?: boolean;
  url?: string;
  token?: string;
  framework?: string;
}

export async function initCommand(_options: InitCommandOptions): Promise<void> {
  const cwd = process.cwd();

  // Detect project configuration
  const s = p.spinner();
  s.start("Detecting project configuration...");

  const [framework, typescript, packageManager] = await Promise.all([
    detectFramework(cwd),
    detectTypeScript(cwd),
    detectPackageManager(cwd),
  ]);

  s.stop("Project configuration detected");

  // Run interactive prompts
  const answers = await runInitPrompts({
    framework,
    typescript,
    packageManager,
  });

  if (!answers) {
    return;
  }

  // Create configuration
  s.start("Creating configuration files...");

  try {
    // Detect module type for JSDoc projects
    let moduleType: "esm" | "commonjs" = "commonjs";
    if (answers.outputFormat === "jsdoc") {
      const detected = await detectModuleType(cwd);
      moduleType = detected.type;
    }

    // Create config file (use .js extension for JSDoc projects)
    const configExtension = answers.outputFormat === "jsdoc" ? "js" : "ts";
    const configContent = generateConfigFile({
      strapiUrl: answers.strapiUrl,
      strapiVersion: answers.strapiVersion,
      apiPrefix: answers.apiPrefix,
      outputFormat: answers.outputFormat,
      outputDir: answers.outputDir,
      generateActions: answers.generateActions,
      generateServices: answers.generateServices,
      moduleType,
    });
    const configPath = path.join(cwd, `strapi.config.${configExtension}`);
    await fs.writeFile(configPath, configContent, "utf-8");

    // Update .env file
    const envPath = path.join(cwd, ".env");
    await appendToEnvFile(envPath, {
      STRAPI_URL: answers.strapiUrl,
      STRAPI_TOKEN: answers.strapiToken,
    });

    // Create output directory
    const outputPath = path.join(cwd, answers.outputDir);
    await fs.mkdir(outputPath, { recursive: true });

    s.stop("Configuration files created");

    // Install dependencies
    const installDeps = await p.confirm({
      message: "Install required dependencies (strapi2front, strapi-sdk-js)?",
      initialValue: true,
    });

    if (p.isCancel(installDeps)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }

    if (installDeps) {
      // Install strapi2front as dev dependency (needed for config file)
      const installStrapi2frontCmd = getInstallDevCommand(packageManager.name, "strapi2front");
      s.start(`Installing strapi2front... (${pc.dim(installStrapi2frontCmd)})`);
      try {
        await execAsync(installStrapi2frontCmd, cwd);
        s.stop(`${pc.green("✓")} strapi2front installed`);
      } catch {
        s.stop(`${pc.red("✗")} Failed to install strapi2front`);
        logger.warn(`Please install manually: ${installStrapi2frontCmd}`);
      }

      // Install strapi-sdk-js as regular dependency
      const installSdkCmd = getInstallCommand(packageManager.name, "strapi-sdk-js");
      s.start(`Installing strapi-sdk-js... (${pc.dim(installSdkCmd)})`);
      try {
        await execAsync(installSdkCmd, cwd);
        s.stop(`${pc.green("✓")} strapi-sdk-js installed`);
      } catch {
        s.stop(`${pc.red("✗")} Failed to install strapi-sdk-js`);
        logger.warn(`Please install manually: ${installSdkCmd}`);
      }
    } else {
      p.log.info(pc.dim("Remember to install dependencies manually:"));
      p.log.info(pc.dim(`  ${getInstallDevCommand(packageManager.name, "strapi2front")}`));
      p.log.info(pc.dim(`  ${getInstallCommand(packageManager.name, "strapi-sdk-js")}`));
    }

    // Show success message
    const configFileName = `strapi.config.${configExtension}`;
    const fileExt = answers.outputFormat === "jsdoc" ? ".js" : ".ts";
    p.note(
      [
        `${pc.green("✓")} Created ${pc.cyan(configFileName)}`,
        `${pc.green("✓")} Updated ${pc.cyan(".env")} with Strapi credentials`,
        `${pc.green("✓")} Created output directory ${pc.cyan(answers.outputDir)}`,
        "",
        `Output format: ${pc.cyan(answers.outputFormat === "jsdoc" ? "JavaScript (JSDoc)" : "TypeScript")}`,
        "",
        `Next steps:`,
        `  1. Run ${pc.cyan("npx strapi2front sync")} to generate files`,
        `  2. Import from ${pc.cyan(answers.outputDir + "/collections/*" + fileExt)}`,
        `  3. Import services from ${pc.cyan(answers.outputDir + "/collections/*.service" + fileExt)}`,
      ].join("\n"),
      "Setup complete!"
    );

    p.outro(pc.green("Happy coding!"));
  } catch (error) {
    s.stop("Failed to create configuration files");
    logger.error(error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}

function generateConfigFile(answers: {
  strapiUrl: string;
  strapiVersion: "v4" | "v5";
  apiPrefix: string;
  outputFormat: "typescript" | "jsdoc";
  outputDir: string;
  generateActions: boolean;
  generateServices: boolean;
  moduleType: "esm" | "commonjs";
}): string {
  const isTypeScript = answers.outputFormat === "typescript";
  const useESM = answers.moduleType === "esm";

  if (isTypeScript) {
    return `import { defineConfig } from "strapi2front";

export default defineConfig({
  // Strapi connection
  url: process.env.STRAPI_URL || "${answers.strapiUrl}",
  token: process.env.STRAPI_TOKEN,

  // API prefix (default: "/api")
  apiPrefix: "${answers.apiPrefix}",

  // Output format: "typescript" (.ts) or "jsdoc" (.js with JSDoc)
  outputFormat: "typescript",

  // Output configuration
  output: {
    path: "${answers.outputDir}",
    types: "types",
    services: "services",
    actions: "actions/strapi",
    structure: 'by-feature' // or 'by-layer'
  },

  // Features to generate
  features: {
    types: true,
    services: ${answers.generateServices},
    actions: ${answers.generateActions},
  },

  // Strapi version
  strapiVersion: "${answers.strapiVersion}",
});
`;
  }

  // JSDoc config (JavaScript) - ESM or CommonJS based on project type
  if (useESM) {
    return `// @ts-check
import { defineConfig } from "strapi2front";

export default defineConfig({
  // Strapi connection
  url: process.env.STRAPI_URL || "${answers.strapiUrl}",
  token: process.env.STRAPI_TOKEN,

  // API prefix (default: "/api")
  apiPrefix: "${answers.apiPrefix}",

  // Output format: "typescript" (.ts) or "jsdoc" (.js with JSDoc)
  outputFormat: "jsdoc",

  // Module type: auto-detected as ESM
  moduleType: "esm",

  // Output configuration
  output: {
    path: "${answers.outputDir}",
    types: "types",
    services: "services",
    structure: 'by-feature' // or 'by-layer'
  },

  // Features to generate
  features: {
    types: true,
    services: ${answers.generateServices},
    actions: false, // Actions require TypeScript
  },

  // Strapi version
  strapiVersion: "${answers.strapiVersion}",
});
`;
  }

  // CommonJS config
  return `// @ts-check
const { defineConfig } = require("strapi2front");

module.exports = defineConfig({
  // Strapi connection
  url: process.env.STRAPI_URL || "${answers.strapiUrl}",
  token: process.env.STRAPI_TOKEN,

  // API prefix (default: "/api")
  apiPrefix: "${answers.apiPrefix}",

  // Output format: "typescript" (.ts) or "jsdoc" (.js with JSDoc)
  outputFormat: "jsdoc",

  // Output configuration
  output: {
    path: "${answers.outputDir}",
    types: "types",
    services: "services",
    structure: 'by-feature' // or 'by-layer'
  },

  // Features to generate
  features: {
    types: true,
    services: ${answers.generateServices},
    actions: false, // Actions require TypeScript
  },

  // Strapi version
  strapiVersion: "${answers.strapiVersion}",
});
`;
}

async function appendToEnvFile(
  envPath: string,
  variables: Record<string, string>
): Promise<void> {
  let content = "";

  try {
    content = await fs.readFile(envPath, "utf-8");
  } catch {
    // File does not exist, create new
  }

  const lines = content.split("\n");
  const existingKeys = new Set(
    lines
      .filter((line) => line.includes("="))
      .map((line) => line.split("=")[0].trim())
  );

  const newLines: string[] = [];

  for (const [key, value] of Object.entries(variables)) {
    if (!existingKeys.has(key)) {
      newLines.push(`${key}=${value}`);
    }
  }

  if (newLines.length > 0) {
    const separator = content.endsWith("\n") || content === "" ? "" : "\n";
    const newContent = content + separator + newLines.join("\n") + "\n";
    await fs.writeFile(envPath, newContent, "utf-8");
  }
}

