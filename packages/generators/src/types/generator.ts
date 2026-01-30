/**
 * Type generator
 * Supports TypeScript (.ts) and JSDoc (.js) output formats
 */

import type { ParsedSchema } from '@strapi2front/core';
import type { OutputFormat, StrapiVersion } from '../shared/types.js';
import { generateTypeScriptTypes } from '../output/typescript/types.js';
import { generateJSDocTypes } from '../output/jsdoc/types.js';

export interface TypeGeneratorOptions {
  outputDir: string;
  blocksRendererInstalled?: boolean;
  strapiVersion?: StrapiVersion;
  /**
   * Output format: 'typescript' for .ts files, 'jsdoc' for .js with JSDoc annotations
   * @default 'typescript'
   */
  outputFormat?: OutputFormat;
}

/**
 * Generate types from parsed schema
 * Supports both TypeScript and JSDoc output formats
 */
export async function generateTypes(
  schema: ParsedSchema,
  options: TypeGeneratorOptions
): Promise<string[]> {
  const outputFormat = options.outputFormat ?? 'typescript';

  if (outputFormat === 'jsdoc') {
    return generateJSDocTypes(schema, {
      outputDir: options.outputDir,
      blocksRendererInstalled: options.blocksRendererInstalled,
      strapiVersion: options.strapiVersion,
    });
  }

  // Default: TypeScript
  return generateTypeScriptTypes(schema, {
    outputDir: options.outputDir,
    blocksRendererInstalled: options.blocksRendererInstalled,
    strapiVersion: options.strapiVersion,
  });
}
