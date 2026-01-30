/**
 * Actions generator
 * Re-exports from frameworks/astro for backwards compatibility
 *
 * For framework-specific generators, import directly from:
 * - '@strapi2front/generators/frameworks/astro'
 * - '@strapi2front/generators/frameworks/nextjs' (coming soon)
 * - '@strapi2front/generators/frameworks/nuxt' (coming soon)
 */

import type { ParsedSchema } from '@strapi2front/core';
import type { StrapiVersion } from '../shared/types.js';
import { generateAstroActions } from '../frameworks/astro/actions.js';

export interface ActionsGeneratorOptions {
  outputDir: string;
  servicesImportPath: string;
  strapiVersion?: StrapiVersion;
}

/**
 * Generate Astro Actions from parsed schema
 * @deprecated Use generateAstroActions from '@strapi2front/generators/frameworks/astro' instead
 */
export async function generateActions(
  schema: ParsedSchema,
  options: ActionsGeneratorOptions
): Promise<string[]> {
  return generateAstroActions(schema, {
    outputDir: options.outputDir,
    servicesImportPath: options.servicesImportPath,
    strapiVersion: options.strapiVersion,
  });
}
