import { z } from "zod";

/**
 * Configuration schema for strapi-integrate
 */
export const configSchema = z.object({
  // Strapi connection
  url: z.string().url("url must be a valid URL"),
  token: z.string().min(1, "token is required").optional(),

  // Strapi version
  strapiVersion: z.enum(["v4", "v5"]).default("v5"),

  // Output paths
  output: z.object({
    path: z.string().default("src/strapi"),
    types: z.string().default("types"),
    services: z.string().default("services"),
    actions: z.string().default("actions/strapi"),
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
