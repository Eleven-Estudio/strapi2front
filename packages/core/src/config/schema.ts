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

  // Output path
  output: z.object({
    path: z.string().default("src/strapi"),
  }).default({}),

  // Features to generate
  features: z.object({
    types: z.boolean().default(true),
    services: z.boolean().default(true),
    actions: z.boolean().default(true),
    // Zod schemas for validation (React Hook Form, TanStack Form, etc.)
    // Default: true for TypeScript, false for JSDoc
    schemas: z.boolean().optional(),
    // Upload helpers (public client + Astro action)
    upload: z.boolean().default(false),
  }).default({}),

  // Schema generation options
  schemaOptions: z.object({
    /**
     * Use advanced relation format with connect/disconnect/set operations
     * instead of simple ID arrays.
     *
     * When false (default): { tags: ["id1", "id2"] }
     * When true: { tags: { connect: [{ documentId: "id1" }], disconnect: [...] } }
     *
     * Advanced format supports:
     * - connect: Add relations while preserving existing
     * - disconnect: Remove specific relations
     * - set: Replace all relations
     * - locale: For i18n content types
     * - status: For draft/published targeting
     * - position: For ordering (before, after, start, end)
     *
     * @default false
     * @see https://docs.strapi.io/dev-docs/api/rest/relations
     */
    advancedRelations: z.boolean().default(false),
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
