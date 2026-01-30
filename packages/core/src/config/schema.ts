import { z } from "zod";

/**
 * Configuration schema for strapi2front
 */
export const configSchema = z.object({
  // Strapi connection
  url: z.string().url("url must be a valid URL"),
  token: z.string().min(1, "token is required").optional(),

  // API prefix (default: "/api", can be customized in Strapi config)
  apiPrefix: z.string().default("/api"),

  // Strapi version
  strapiVersion: z.enum(["v4", "v5"]).default("v5"),

  // Output format: 'typescript' for .ts files, 'jsdoc' for .js with JSDoc annotations
  outputFormat: z.enum(["typescript", "jsdoc"]).default("typescript"),

  // Module type: 'esm' for ES Modules, 'commonjs' for CommonJS (auto-detected if not specified)
  moduleType: z.enum(["esm", "commonjs"]).optional(),

  // Output paths
  output: z.object({
    path: z.string().default("src/strapi"),
    types: z.string().default("types"),
    services: z.string().default("services"),
    actions: z.string().optional().default("actions/strapi"),
    // Output structure: 'by-layer' (types/, services/, actions/) or 'by-feature' (article/, category/)
    structure: z.enum(["by-layer", "by-feature"]).default("by-feature"),
  }).default({}),

  // Features to generate
  features: z.object({
    types: z.boolean().default(true),
    services: z.boolean().default(true),
    actions: z.boolean().default(true),
  }).default({}),

  // Advanced options
  options: z.object({
    // Include draft content types
    includeDrafts: z.boolean().default(false),
    // Generate strict types (no optional fields)
    strictTypes: z.boolean().default(false),
  }).default({}),
});

export type StrapiIntegrateConfig = z.infer<typeof configSchema>;
export type StrapiIntegrateConfigInput = z.input<typeof configSchema>;
