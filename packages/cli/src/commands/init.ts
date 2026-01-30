import * as p from "@clack/prompts";
import pc from "picocolors";
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { detectFramework } from "../lib/detectors/framework.js";
import { detectTypeScript } from "../lib/detectors/typescript.js";
import { detectPackageManager, getInstallCommand, getInstallDevCommand } from "../lib/detectors/package-manager.js";
import { runInitPrompts } from "../lib/prompts/init.prompts.js";
import { logger } from "../lib/utils/logger.js";

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
    // Create strapi.config.ts
    const configContent = generateConfigFile({
      strapiUrl: answers.strapiUrl,
      strapiVersion: answers.strapiVersion,
      outputDir: answers.outputDir,
      generateActions: answers.generateActions,
      generateServices: answers.generateServices,
    });
    const configPath = path.join(cwd, "strapi.config.ts");
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
      s.start("Installing strapi2front...");
      try {
        const installStrapi2frontCmd = getInstallDevCommand(packageManager.name, "strapi2front");
        execSync(installStrapi2frontCmd, { cwd, stdio: "ignore" });
        s.stop("strapi2front installed");
      } catch {
        s.stop("Failed to install strapi2front");
        logger.warn(`Please install manually: ${getInstallDevCommand(packageManager.name, "strapi2front")}`);
      }

      // Install strapi-sdk-js as regular dependency
      s.start("Installing strapi-sdk-js...");
      try {
        const installSdkCmd = getInstallCommand(packageManager.name, "strapi-sdk-js");
        execSync(installSdkCmd, { cwd, stdio: "ignore" });
        s.stop("strapi-sdk-js installed");
      } catch {
        s.stop("Failed to install strapi-sdk-js");
        logger.warn(`Please install manually: ${getInstallCommand(packageManager.name, "strapi-sdk-js")}`);
      }
    } else {
      p.log.info(pc.dim("Remember to install dependencies manually:"));
      p.log.info(pc.dim(`  ${getInstallDevCommand(packageManager.name, "strapi2front")}`));
      p.log.info(pc.dim(`  ${getInstallCommand(packageManager.name, "strapi-sdk-js")}`));
    }

    // Show success message
    p.note(
      [
        `${pc.green("v")} Created ${pc.cyan("strapi.config.ts")}`,
        `${pc.green("v")} Updated ${pc.cyan(".env")} with Strapi credentials`,
        `${pc.green("v")} Created output directory ${pc.cyan(answers.outputDir)}`,
        "",
        `Next steps:`,
        `  1. Run ${pc.cyan("npx strapi2front sync")} to generate types`,
        `  2. Import types from ${pc.cyan(answers.outputDir + "/types")}`,
        `  3. Import services from ${pc.cyan(answers.outputDir + "/services")}`,
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
  outputDir: string;
  generateActions: boolean;
  generateServices: boolean;
}): string {
  return `import { defineConfig } from "strapi2front";

export default defineConfig({
  // Strapi connection
  url: process.env.STRAPI_URL || "${answers.strapiUrl}",
  token: process.env.STRAPI_TOKEN,

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

