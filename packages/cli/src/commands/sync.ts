import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "node:path";
import { loadConfig } from "@strapi-integrate/core";
import { fetchSchema } from "@strapi-integrate/core";
import { parseSchema } from "@strapi-integrate/core";
import { generateTypes } from "@strapi-integrate/generators";
import { generateServices } from "@strapi-integrate/generators";
import { generateActions } from "@strapi-integrate/generators";
import { generateClient } from "@strapi-integrate/generators";
import { generateLocales } from "@strapi-integrate/generators";
import { logger } from "../lib/utils/logger.js";

export interface SyncCommandOptions {
  force?: boolean;
  typesOnly?: boolean;
  servicesOnly?: boolean;
  actionsOnly?: boolean;
}

export async function syncCommand(options: SyncCommandOptions): Promise<void> {
  const cwd = process.cwd();

  p.intro(pc.cyan("strapi-integrate sync"));

  const s = p.spinner();

  try {
    // Load configuration
    s.start("Loading configuration...");
    const config = await loadConfig(cwd);
    s.stop("Configuration loaded");

    // Fetch schema from Strapi
    s.start("Fetching schema from Strapi...");
    const rawSchema = await fetchSchema(config.url, config.token);
    const schema = parseSchema(rawSchema);
    s.stop(`Schema fetched: ${schema.collections.length} collections, ${schema.singles.length} singles, ${schema.components.length} components`);

    const outputPath = path.join(cwd, config.output.path);
    const generatedFiles: string[] = [];

    // Determine what to generate
    const generateAll = !options.typesOnly && !options.servicesOnly && !options.actionsOnly;

    // Generate types
    if (generateAll || options.typesOnly) {
      if (config.features.types) {
        s.start("Generating types...");
        const typesPath = path.join(outputPath, config.output.types);
        const files = await generateTypes(schema, { outputDir: typesPath });
        generatedFiles.push(...files);
        s.stop(`Generated ${files.length} type files`);
      }
    }

    // Generate client (needed by services)
    if (generateAll || options.servicesOnly) {
      if (config.features.services) {
        s.start("Generating client...");
        const clientFiles = await generateClient({ outputDir: outputPath });
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
        });
        generatedFiles.push(...files);
        s.stop(`Generated ${files.length} action files`);
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
