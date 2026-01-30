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
import { generateTypes } from "@strapi2front/generators";
import { generateServices } from "@strapi2front/generators";
import { generateActions } from "@strapi2front/generators";
import { generateClient } from "@strapi2front/generators";
import { generateLocales } from "@strapi2front/generators";
import { generateByFeature } from "@strapi2front/generators";
import { logger } from "../lib/utils/logger.js";

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

/**
 * Structure type for output organization
 */
type OutputStructure = "by-layer" | "by-feature";

/**
 * Get orphaned folders from the opposite structure
 */
function getOrphanedFolders(outputPath: string, currentStructure: OutputStructure): string[] {
  const orphanedFolders: string[] = [];

  if (currentStructure === "by-feature") {
    // If using by-feature, check for by-layer folders
    const byLayerFolders = ["types", "services", "actions"];
    for (const folder of byLayerFolders) {
      const folderPath = path.join(outputPath, folder);
      if (fs.existsSync(folderPath)) {
        orphanedFolders.push(folder);
      }
    }
    // Also check for root-level client.ts and locales.ts (by-layer puts them at root)
    if (fs.existsSync(path.join(outputPath, "client.ts"))) {
      orphanedFolders.push("client.ts");
    }
    if (fs.existsSync(path.join(outputPath, "locales.ts"))) {
      orphanedFolders.push("locales.ts");
    }
  } else {
    // If using by-layer, check for by-feature folders
    const byFeatureFolders = ["collections", "singles", "shared", "components"];
    for (const folder of byFeatureFolders) {
      const folderPath = path.join(outputPath, folder);
      if (fs.existsSync(folderPath)) {
        orphanedFolders.push(folder);
      }
    }
  }

  return orphanedFolders;
}

/**
 * Remove orphaned folders/files
 */
function cleanOrphanedFiles(outputPath: string, orphanedItems: string[]): void {
  for (const item of orphanedItems) {
    const itemPath = path.join(outputPath, item);
    if (fs.existsSync(itemPath)) {
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
    }
  }
}

export interface SyncCommandOptions {
  force?: boolean;
  typesOnly?: boolean;
  servicesOnly?: boolean;
  actionsOnly?: boolean;
  clean?: boolean;
}

export async function syncCommand(options: SyncCommandOptions): Promise<void> {
  const cwd = process.cwd();

  p.intro(pc.cyan("strapi-integrate sync"));

  const s = p.spinner();

  try {
    // Load configuration
    s.start("Loading configuration...");
    let config = await loadConfig(cwd);
    s.stop("Configuration loaded");

    // Detect and validate Strapi version
    s.start("Detecting Strapi version...");
    const versionResult = await detectStrapiVersion(config.url, config.token);
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
    const rawSchema = await fetchSchema(config.url, config.token);
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
    const generateAll = !options.typesOnly && !options.servicesOnly && !options.actionsOnly;

    // Check structure mode
    const isByFeature = config.output.structure === 'by-feature';
    const currentStructure: OutputStructure = isByFeature ? "by-feature" : "by-layer";

    // Check for orphaned files from previous structure
    if (fs.existsSync(outputPath)) {
      const orphanedFolders = getOrphanedFolders(outputPath, currentStructure);

      if (orphanedFolders.length > 0) {
        const otherStructure = isByFeature ? "by-layer" : "by-feature";
        p.log.warn(
          pc.yellow(`Found files from previous ${pc.bold(otherStructure)} structure:`)
        );
        p.log.message(pc.dim(`  ${orphanedFolders.join(", ")}`));

        let shouldClean = options.clean;

        if (!shouldClean) {
          const cleanResponse = await p.confirm({
            message: `Remove orphaned ${otherStructure} files?`,
            initialValue: true,
          });

          if (p.isCancel(cleanResponse)) {
            p.cancel("Sync cancelled");
            process.exit(0);
          }

          shouldClean = cleanResponse;
        }

        if (shouldClean) {
          s.start("Cleaning orphaned files...");
          cleanOrphanedFiles(outputPath, orphanedFolders);
          s.stop(`Removed: ${orphanedFolders.join(", ")}`);
        } else {
          p.log.info(pc.dim("Keeping orphaned files. You can clean them manually or use --clean flag."));
        }
      }
    }

    if (isByFeature) {
      // Generate using by-feature structure (screaming architecture)
      s.start("Generating files (by-feature structure)...");
      const files = await generateByFeature(schema, rawSchema.locales, {
        outputDir: outputPath,
        features: {
          types: config.features.types && (generateAll || Boolean(options.typesOnly)),
          services: config.features.services && (generateAll || Boolean(options.servicesOnly)),
          actions: config.features.actions && (generateAll || Boolean(options.actionsOnly)),
        },
        blocksRendererInstalled,
        strapiVersion: config.strapiVersion,
      });
      generatedFiles.push(...files);
      s.stop(`Generated ${files.length} files`);
    } else {
      // Generate using by-layer structure (default)

      // Generate types
      if (generateAll || options.typesOnly) {
        if (config.features.types) {
          s.start("Generating types...");
          const typesPath = path.join(outputPath, config.output.types);
          const files = await generateTypes(schema, {
            outputDir: typesPath,
            blocksRendererInstalled,
            strapiVersion: config.strapiVersion,
          });
          generatedFiles.push(...files);
          s.stop(`Generated ${files.length} type files`);
        }
      }

      // Generate client (needed by services)
      if (generateAll || options.servicesOnly) {
        if (config.features.services) {
          s.start("Generating client...");
          const clientFiles = await generateClient({ outputDir: outputPath, strapiVersion: config.strapiVersion });
          generatedFiles.push(...clientFiles);
          s.stop("Generated client");

          // Generate locales (for i18n support)
          s.start("Generating locales...");
          const localesFiles = await generateLocales(rawSchema.locales, { outputDir: outputPath });
          generatedFiles.push(...localesFiles);
          if (rawSchema.locales.length > 0) {
            s.stop(`Generated locales: ${rawSchema.locales.map(l => l.code).join(", ")}`);
          } else {
            s.stop("Generated locales (i18n not enabled in Strapi)");
          }
        }
      }

      // Generate services
      if (generateAll || options.servicesOnly) {
        if (config.features.services) {
          s.start("Generating services...");
          const servicesPath = path.join(outputPath, config.output.services);
          const typesImportPath = path.relative(servicesPath, path.join(outputPath, config.output.types)).replace(/\\/g, "/") || ".";
          const files = await generateServices(schema, {
            outputDir: servicesPath,
            typesImportPath: typesImportPath.startsWith(".") ? typesImportPath : "./" + typesImportPath,
            strapiVersion: config.strapiVersion,
          });
          generatedFiles.push(...files);
          s.stop(`Generated ${files.length} service files`);
        }
      }

      // Generate actions
      if (generateAll || options.actionsOnly) {
        if (config.features.actions) {
          s.start("Generating Astro actions...");
          const actionsPath = path.join(outputPath, config.output.actions);
          const servicesPath = path.join(outputPath, config.output.services);

          const servicesImportPath = path.relative(actionsPath, servicesPath).replace(/\\/g, "/") || ".";

          const files = await generateActions(schema, {
            outputDir: actionsPath,
            servicesImportPath: servicesImportPath.startsWith(".") ? servicesImportPath : "./" + servicesImportPath,
            strapiVersion: config.strapiVersion,
          });
          generatedFiles.push(...files);
          s.stop(`Generated ${files.length} action files`);
        }
      }
    }

    // Show summary
    p.note(
      [
        `Generated ${generatedFiles.length} files in ${pc.cyan(config.output.path)}`,
        "",
        "Files generated:",
        ...generatedFiles.slice(0, 10).map((f) => `  ${pc.dim(path.relative(cwd, f))}`),
        generatedFiles.length > 10 ? `  ${pc.dim(`... and ${generatedFiles.length - 10} more`)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      "Sync complete!"
    );

    p.outro(pc.green("Types and services are ready to use!"));
  } catch (error) {
    s.stop("Sync failed");

    if (error instanceof Error) {
      logger.error(error.message);

      if (error.message.includes("Could not find strapi.config")) {
        logger.info("Run \"npx strapi-integrate init\" first to set up your project.");
      }
    } else {
      logger.error("An unknown error occurred");
    }

    process.exit(1);
  }
}
