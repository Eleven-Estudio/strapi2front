/**
 * Nuxt Server Routes generator
 * Generates type-safe server routes for Strapi content types
 *
 * Requirements:
 * - Nuxt 3+
 * - TypeScript enabled
 *
 * Status: COMING SOON
 */

import type { ParsedSchema } from '@strapi2front/core';
import type { StrapiVersion } from '../../shared/types.js';

export interface NuxtServerRoutesOptions {
  outputDir: string;
  servicesImportPath: string;
  strapiVersion?: StrapiVersion;
}

/**
 * Generate Nuxt Server Routes from parsed schema
 *
 * @throws Error - Not yet implemented
 */
export async function generateNuxtServerRoutes(
  _schema: ParsedSchema,
  _options: NuxtServerRoutesOptions
): Promise<string[]> {
  throw new Error(
    'Nuxt Server Routes generator is not yet implemented. ' +
    'Coming soon! For now, you can use the generated services directly.'
  );
}

/**
 * Check if Nuxt Server Routes are supported
 * Requires Nuxt 3+
 */
export function isNuxtServerRoutesSupported(nuxtVersion: string | null): boolean {
  if (!nuxtVersion) return false;

  // Remove ^ or ~ prefix and get major version
  const match = nuxtVersion.replace(/^[\^~]/, "").match(/^(\d+)/);
  const majorVersion = match ? parseInt(match[1], 10) : null;

  return majorVersion !== null && majorVersion >= 3;
}
