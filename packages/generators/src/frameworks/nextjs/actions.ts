/**
 * Next.js Server Actions generator
 * Generates type-safe Server Actions for Strapi content types
 *
 * Requirements:
 * - Next.js 14+ (Server Actions)
 * - TypeScript enabled
 *
 * Status: COMING SOON
 */

import type { ParsedSchema } from '@strapi2front/core';
import type { StrapiVersion } from '../../shared/types.js';

export interface NextJsActionsOptions {
  outputDir: string;
  servicesImportPath: string;
  strapiVersion?: StrapiVersion;
}

/**
 * Generate Next.js Server Actions from parsed schema
 *
 * @throws Error - Not yet implemented
 */
export async function generateNextJsActions(
  _schema: ParsedSchema,
  _options: NextJsActionsOptions
): Promise<string[]> {
  throw new Error(
    'Next.js Server Actions generator is not yet implemented. ' +
    'Coming soon! For now, you can use the generated services directly.'
  );
}

/**
 * Check if Next.js Server Actions are supported
 * Requires Next.js 14+ with App Router
 */
export function isNextJsActionsSupported(nextVersion: string | null): boolean {
  if (!nextVersion) return false;

  // Remove ^ or ~ prefix and get major version
  const match = nextVersion.replace(/^[\^~]/, "").match(/^(\d+)/);
  const majorVersion = match ? parseInt(match[1], 10) : null;

  return majorVersion !== null && majorVersion >= 14;
}
