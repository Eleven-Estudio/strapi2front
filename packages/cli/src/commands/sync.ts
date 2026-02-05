import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { loadConfig } from "@strapi2front/core";
import { fetchSchema, detectStrapiVersion } from "@strapi2front/core";
import { parseSchema } from "@strapi2front/core";
import type { StrapiVersion } from "@strapi2front/core";
import type { ParsedSchema, Attribute } from "@strapi2front/core";
import { generateByFeature } from "@strapi2front/generators";
import { logger } from "../lib/utils/logger.js";
import { detectModuleType } from "../lib/detectors/module-type.js";

const BLOCKS_RENDERER_PACKAGE = "@strapi/blocks-react-renderer";

/**
 * Check if schema contains any blocks fields
 */
function schemaHasBlocks(schema: ParsedSchema): { hasBlocks: boolean; fieldsFound: string[] } {
  const fieldsFound: string[] = [];

  const checkAttributes = (typeName: string, attributes: Record<string, Attribute>): void => {
    for (const [fieldName, attr] of Object.entries(attributes)) {
      if (attr.type === "blocks") {
        fieldsFound.push(`${typeName}.${fieldName}`);
      }
    }
  };

  for (const collection of schema.collections) {
    checkAttributes(collection.singularName, collection.attributes);
  }

  for (const single of schema.singles) {
    checkAttributes(single.singularName, single.attributes);
  }

  for (const component of schema.components) {
    checkAttributes(`component:${component.name}`, component.attributes);
  }

  return { hasBlocks: fieldsFound.length > 0, fieldsFound };
}

/**
 * Check if a package is installed
 */
function isPackageInstalled(packageName: string, cwd: string): boolean {
  try {
    const packageJsonPath = path.join(cwd, "package.json");
    if (!fs.existsSync(packageJsonPath)) return false;

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    return packageName in deps;
  } catch {
    return false;
  }
}

/**
 * Detect package manager
 */
function detectPackageManager(cwd: string): "npm" | "yarn" | "pnpm" | "bun" {
  if (fs.existsSync(path.join(cwd, "bun.lockb"))) return "bun";
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

/**
 * Install a package
 */
function installPackage(packageName: string, cwd: string): void {
  const pm = detectPackageManager(cwd);
  const commands: Record<string, string> = {
    npm: `npm install ${packageName}`,
    yarn: `yarn add ${packageName}`,
    pnpm: `pnpm add ${packageName}`,
    bun: `bun add ${packageName}`,
  };

  execSync(commands[pm], { cwd, stdio: "inherit" });
}

export interface SyncCommandOptions {
  force?: boolean;
  typesOnly?: boolean;
  servicesOnly?: boolean;
  actionsOnly?: boolean;
  schemasOnly?: boolean;
  uploadOnly?: boolean;
}

export async function syncCommand(options: SyncCommandOptions): Promise<void> {
  const cwd = process.cwd();

  p.intro(pc.cyan("strapi2front sync"));

  const s = p.spinner();

  try {
    // Load configuration
    s.start("Loading configuration...");
    let config = await loadConfig(cwd);
    s.stop("Configuration loaded");

    // Detect and validate Strapi version
    s.start("Detecting Strapi version...");
    const versionResult = await detectStrapiVersion(config.url, config.token, config.apiPrefix);
    s.stop("Version detection complete");

    let effectiveVersion: StrapiVersion = config.strapiVersion;

    if (versionResult.detected) {
      if (versionResult.detected !== config.strapiVersion) {
        // Version mismatch detected
        if (versionResult.detected === "v5" && config.strapiVersion === "v4") {
          p.log.warn(
            pc.yellow(`Detected Strapi ${pc.bold("v5")} but config has ${pc.bold("v4")}. Using v5.`)
          );
          effectiveVersion = "v5";
        } else if (versionResult.detected === "v4" && config.strapiVersion === "v5") {
          p.log.warn(
            pc.yellow(`Detected Strapi ${pc.bold("v4")} but config has ${pc.bold("v5")}. Using v4.`)
          );
          effectiveVersion = "v4";
        }
      } else {
        p.log.info(`Strapi ${pc.green(pc.bold(config.strapiVersion))}`);
      }
    } else {
      p.log.warn(pc.yellow(`Could not detect Strapi version. Using ${pc.bold(config.strapiVersion)}`));
    }

    // Update config with effective version for this sync
    config = { ...config, strapiVersion: effectiveVersion };

    // Fetch schema from Strapi
    s.start("Fetching schema from Strapi...");
    const rawSchema = await fetchSchema(config.url, config.token, config.apiPrefix);
    const schema = parseSchema(rawSchema);
    s.stop(`Schema fetched: ${schema.collections.length} collections, ${schema.singles.length} singles, ${schema.components.length} components`);

    // Check for Blocks fields and prompt for renderer package
    let blocksRendererInstalled = isPackageInstalled(BLOCKS_RENDERER_PACKAGE, cwd);
    const { hasBlocks: hasBlocksFields, fieldsFound: blocksFieldsFound } = schemaHasBlocks(schema);

    if (hasBlocksFields && !blocksRendererInstalled) {
      p.log.info(`Blocks fields detected: ${pc.cyan(blocksFieldsFound.join(", "))}`);

      const installBlocks = await p.confirm({
        message: `Install ${pc.cyan(BLOCKS_RENDERER_PACKAGE)} for proper type support and rendering?`,
        initialValue: true,
      });

      if (p.isCancel(installBlocks)) {
        p.cancel("Sync cancelled");
        process.exit(0);
      }

      if (installBlocks) {
        s.start(`Installing ${BLOCKS_RENDERER_PACKAGE}...`);
        try {
          installPackage(BLOCKS_RENDERER_PACKAGE, cwd);
          blocksRendererInstalled = true;
          s.stop(`${BLOCKS_RENDERER_PACKAGE} installed`);
        } catch (error) {
          s.stop(`Failed to install ${BLOCKS_RENDERER_PACKAGE}`);
          logger.warn("You can install it manually later and re-run sync");
        }
      } else {
        p.log.info(pc.dim(`Skipping ${BLOCKS_RENDERER_PACKAGE}. BlocksContent will be typed as unknown[]`));
      }
    }

    const outputPath = path.join(cwd, config.output.path);
    const generatedFiles: string[] = [];

    // Determine what to generate
    const generateAll = !options.typesOnly && !options.servicesOnly && !options.actionsOnly && !options.schemasOnly && !options.uploadOnly;

    // Get output format from config (default to typescript)
    const outputFormat = config.outputFormat || "typescript";

    // Detect module type for JSDoc output (ESM vs CommonJS)
    let moduleType: "esm" | "commonjs" = "commonjs";
    if (outputFormat === "jsdoc") {
      if (config.moduleType) {
        moduleType = config.moduleType;
        p.log.info(`Module type: ${pc.cyan(moduleType)} (from config)`);
      } else {
        const detected = await detectModuleType(cwd);
        moduleType = detected.type;
        p.log.info(`Module type: ${pc.cyan(moduleType)} (${detected.reason})`);
      }
    }

    // Generate using by-feature structure (screaming architecture)
    s.start(`Generating files (${outputFormat})...`);
    const files = await generateByFeature(schema, rawSchema.locales, {
      outputDir: outputPath,
      features: {
        types: config.features.types && (generateAll || Boolean(options.typesOnly)),
        services: config.features.services && (generateAll || Boolean(options.servicesOnly)),
        actions: config.features.actions && outputFormat === "typescript" && (generateAll || Boolean(options.actionsOnly)),
        schemas: config.features.schemas && (generateAll || Boolean(options.schemasOnly)),
        upload: config.features.upload && (generateAll || Boolean(options.uploadOnly)),
      },
      schemaOptions: config.schemaOptions,
      blocksRendererInstalled,
      strapiVersion: config.strapiVersion,
      apiPrefix: config.apiPrefix,
      outputFormat,
      moduleType,
    });
    generatedFiles.push(...files);
    s.stop(`Generated ${files.length} files`);

    // Show summary
    p.note(
      [
        `Generated ${generatedFiles.length} files in ${pc.cyan(config.output.path)}`,
        "",
        "Files generated:",
        ...generatedFiles.slice(0, 10).map((f) => `  ${pc.dim(path.relative(cwd, f))}`),
        generatedFiles.length > 10 ? `  ${pc.dim(`... and ${generatedFiles.length - 10} more`)}` : "",
        "",
        `Docs: ${pc.dim("https://strapi2front.dev/docs")}`,
      ]
        .filter(Boolean)
        .join("\n"),
      "Sync complete!"
    );

    const generatedFeatures: string[] = [];
    if (config.features.types) generatedFeatures.push("Types");
    if (config.features.services) generatedFeatures.push("Services");
    if (config.features.schemas) generatedFeatures.push("Schemas");
    if (config.features.actions) generatedFeatures.push("Actions");
    if (config.features.upload) generatedFeatures.push("Upload");
    p.outro(pc.green(`${generatedFeatures.join(", ")} ready to use!`));
  } catch (error) {
    s.stop("Sync failed");

    if (error instanceof Error) {
      logger.error(error.message);

      if (error.message.includes("Could not find strapi.config")) {
        logger.info("Run \"npx strapi2front init\" first to set up your project.");
      }
    } else {
      logger.error("An unknown error occurred");
    }

    logger.info(`Docs: ${pc.dim("https://strapi2front.dev/docs")}`);
    process.exit(1);
  }
}
