/**
 * TypeScript type generator
 * Generates .ts files with interfaces
 */

import path from 'node:path';
import type { ParsedSchema, CollectionType, SingleType, ComponentType, Attribute } from '@strapi2front/core';
import type { StrapiVersion } from '../../shared/types.js';
import { formatCode } from '../../utils/formatter.js';
import { writeFile, ensureDir } from '../../utils/file.js';
import { toPascalCase, toKebabCase } from '../../utils/naming.js';
import { mapAttributeToType, getAttributeComment, extractDependencies } from '../../shared/type-mapper.js';

export interface TypeScriptTypesOptions {
  outputDir: string;
  blocksRendererInstalled?: boolean;
  strapiVersion?: StrapiVersion;
}

/**
 * Generate TypeScript types from parsed schema
 */
export async function generateTypeScriptTypes(
  schema: ParsedSchema,
  options: TypeScriptTypesOptions
): Promise<string[]> {
  const { outputDir } = options;
  const generatedFiles: string[] = [];

  // Ensure directories exist
  await ensureDir(path.join(outputDir, 'collections'));
  await ensureDir(path.join(outputDir, 'components'));

  // Generate utility types
  const utilsPath = path.join(outputDir, 'utils.ts');
  const strapiVersion = options.strapiVersion ?? 'v5';
  await writeFile(utilsPath, await formatCode(generateUtilityTypes(options.blocksRendererInstalled ?? false, strapiVersion)));
  generatedFiles.push(utilsPath);

  // Generate collection types
  for (const collection of schema.collections) {
    const fileName = `${toKebabCase(collection.singularName)}.ts`;
    const filePath = path.join(outputDir, 'collections', fileName);
    const content = generateCollectionType(collection, schema.components);
    await writeFile(filePath, await formatCode(content));
    generatedFiles.push(filePath);
  }

  // Generate single types
  for (const single of schema.singles) {
    const fileName = `${toKebabCase(single.singularName)}.ts`;
    const filePath = path.join(outputDir, 'collections', fileName);
    const content = generateSingleType(single, schema.components);
    await writeFile(filePath, await formatCode(content));
    generatedFiles.push(filePath);
  }

  // Generate component types
  for (const component of schema.components) {
    const fileName = `${toKebabCase(component.name)}.ts`;
    const filePath = path.join(outputDir, 'components', fileName);
    const content = generateComponentType(component);
    await writeFile(filePath, await formatCode(content));
    generatedFiles.push(filePath);
  }

  return generatedFiles;
}

/**
 * Generate utility types
 */
function generateUtilityTypes(blocksRendererInstalled: boolean, strapiVersion: StrapiVersion): string {
  const isV4 = strapiVersion === "v4";

  const blocksContentType = isV4
    ? `/**
 * Rich text content (Strapi v4)
 * Can be markdown string or custom JSON structure
 */
export type RichTextContent = string;`
    : blocksRendererInstalled
    ? `/**
 * Blocks content type (Strapi v5 rich text)
 * Re-exported from @strapi/blocks-react-renderer
 */
export type { BlocksContent } from '@strapi/blocks-react-renderer';`
    : `/**
 * Blocks content type (Strapi v5 rich text)
 *
 * For full type support and rendering, install:
 * npm install @strapi/blocks-react-renderer
 *
 * Then re-run: npx strapi2front sync
 */
export type BlocksContent = unknown[];`;

  const baseEntity = isV4
    ? `/**
 * Base entity fields (Strapi v4)
 */
export interface StrapiBaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}`
    : `/**
 * Base entity fields (Strapi v5)
 */
export interface StrapiBaseEntity {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}`;

  const mediaType = isV4
    ? `/**
 * Strapi media object (v4)
 */
export interface StrapiMedia {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: {
    thumbnail?: StrapiMediaFormat;
    small?: StrapiMediaFormat;
    medium?: StrapiMediaFormat;
    large?: StrapiMediaFormat;
  } | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}`
    : `/**
 * Strapi media object (v5)
 */
export interface StrapiMedia {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: {
    thumbnail?: StrapiMediaFormat;
    small?: StrapiMediaFormat;
    medium?: StrapiMediaFormat;
    large?: StrapiMediaFormat;
  } | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}`;

  const rawResponseTypes = isV4
    ? `
/**
 * Strapi v4 raw API response (with nested attributes)
 */
export interface StrapiV4RawItem<T> {
  id: number;
  attributes: Omit<T, 'id'>;
}

export interface StrapiV4RawResponse<T> {
  data: StrapiV4RawItem<T>;
  meta: Record<string, unknown>;
}

export interface StrapiV4RawListResponse<T> {
  data: StrapiV4RawItem<T>[];
  meta: {
    pagination: StrapiPagination;
  };
}

/**
 * Flatten Strapi v4 response item
 */
export function flattenV4Response<T>(item: StrapiV4RawItem<T>): T {
  return { id: item.id, ...item.attributes } as T;
}

/**
 * Flatten Strapi v4 list response
 */
export function flattenV4ListResponse<T>(items: StrapiV4RawItem<T>[]): T[] {
  return items.map(item => flattenV4Response<T>(item));
}`
    : '';

  return `/**
 * Strapi utility types
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

${mediaType}

export interface StrapiMediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  url: string;
}

/**
 * Strapi pagination
 */
export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/**
 * Strapi response wrapper
 */
export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: StrapiPagination;
  };
}

/**
 * Strapi list response
 */
export interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: StrapiPagination;
  };
}

${baseEntity}
${rawResponseTypes}
${blocksContentType}
`;
}

/**
 * Generate import statements for dependencies
 */
function generateDependencyImports(
  relations: Set<string>,
  components: Set<string>
): string {
  const imports: string[] = [];

  // Import relations (other collections/singles)
  for (const relation of relations) {
    const typeName = toPascalCase(relation);
    const fileName = toKebabCase(relation);
    imports.push(`import type { ${typeName} } from './${fileName}';`);
  }

  // Import components
  for (const component of components) {
    const typeName = toPascalCase(component);
    const fileName = toKebabCase(component);
    imports.push(`import type { ${typeName} } from '../components/${fileName}';`);
  }

  return imports.join('\n');
}

/**
 * Generate type for a collection
 */
function generateCollectionType(collection: CollectionType, components: ComponentType[]): string {
  const typeName = toPascalCase(collection.singularName);
  const attributes = generateAttributes(collection.attributes, components);
  const { relations, components: componentDeps } = extractDependencies(collection.attributes, typeName);
  const dependencyImports = generateDependencyImports(relations, componentDeps);

  // Build utils imports based on what's actually used
  const utilsImports: string[] = ['StrapiBaseEntity'];
  const attributesStr = JSON.stringify(collection.attributes);
  if (attributesStr.includes('"type":"media"')) {
    utilsImports.push('StrapiMedia');
  }
  if (attributesStr.includes('"type":"blocks"')) {
    utilsImports.push('BlocksContent');
  }

  return `/**
 * ${collection.displayName}
 * ${collection.description || ''}
 * Generated by strapi2front
 */

import type { ${utilsImports.join(', ')} } from '../utils';
${dependencyImports ? dependencyImports + '\n' : ''}
export interface ${typeName} extends StrapiBaseEntity {
${attributes}
}

export interface ${typeName}Filters {
  id?: number | { $eq?: number; $ne?: number; $in?: number[]; $notIn?: number[] };
  documentId?: string | { $eq?: string; $ne?: string };
  createdAt?: string | { $eq?: string; $gt?: string; $gte?: string; $lt?: string; $lte?: string };
  updatedAt?: string | { $eq?: string; $gt?: string; $gte?: string; $lt?: string; $lte?: string };
  publishedAt?: string | null | { $eq?: string; $ne?: string; $null?: boolean };
  $and?: ${typeName}Filters[];
  $or?: ${typeName}Filters[];
  $not?: ${typeName}Filters;
}

export interface ${typeName}Sort {
  field: keyof ${typeName};
  order: 'asc' | 'desc';
}
`;
}

/**
 * Generate type for a single type
 */
function generateSingleType(single: SingleType, components: ComponentType[]): string {
  const typeName = toPascalCase(single.singularName);
  const attributes = generateAttributes(single.attributes, components);
  const { relations, components: componentDeps } = extractDependencies(single.attributes, typeName);
  const dependencyImports = generateDependencyImports(relations, componentDeps);

  // Build utils imports based on what's actually used
  const utilsImports: string[] = ['StrapiBaseEntity'];
  const attributesStr = JSON.stringify(single.attributes);
  if (attributesStr.includes('"type":"media"')) {
    utilsImports.push('StrapiMedia');
  }
  if (attributesStr.includes('"type":"blocks"')) {
    utilsImports.push('BlocksContent');
  }

  return `/**
 * ${single.displayName}
 * ${single.description || ''}
 * Generated by strapi2front
 */

import type { ${utilsImports.join(', ')} } from '../utils';
${dependencyImports ? dependencyImports + '\n' : ''}
export interface ${typeName} extends StrapiBaseEntity {
${attributes}
}
`;
}

/**
 * Generate type for a component
 */
function generateComponentType(component: ComponentType): string {
  const typeName = toPascalCase(component.name);
  const attributes = generateAttributes(component.attributes, []);
  const { relations, components: componentDeps } = extractDependencies(component.attributes, typeName);

  // For components, relations import from collections and other components import from same folder
  const imports: string[] = [];

  for (const relation of relations) {
    const relTypeName = toPascalCase(relation);
    const fileName = toKebabCase(relation);
    imports.push(`import type { ${relTypeName} } from '../collections/${fileName}';`);
  }

  for (const comp of componentDeps) {
    const compTypeName = toPascalCase(comp);
    const fileName = toKebabCase(comp);
    // Don't import self
    if (compTypeName !== typeName) {
      imports.push(`import type { ${compTypeName} } from './${fileName}';`);
    }
  }

  // Build utils imports based on what's actually used
  const utilsImports: string[] = [];
  const attributesStr = JSON.stringify(component.attributes);
  if (attributesStr.includes('"type":"media"')) {
    utilsImports.push('StrapiMedia');
  }
  if (attributesStr.includes('"type":"blocks"')) {
    utilsImports.push('BlocksContent');
  }

  const utilsImportLine = utilsImports.length > 0
    ? `import type { ${utilsImports.join(', ')} } from '../utils';\n`
    : '';
  const dependencyImports = imports.length > 0 ? imports.join('\n') + '\n' : '';

  return `/**
 * ${component.displayName} component
 * Category: ${component.category}
 * ${component.description || ''}
 * Generated by strapi2front
 */

${utilsImportLine}${dependencyImports}
export interface ${typeName} {
  id: number;
${attributes}
}
`;
}

/**
 * Generate TypeScript properties from Strapi attributes
 */
function generateAttributes(
  attributes: Record<string, Attribute>,
  components: ComponentType[]
): string {
  const lines: string[] = [];

  for (const [name, attr] of Object.entries(attributes)) {
    const mappedType = mapAttributeToType(attr, components);
    const optional = attr.required ? '' : '?';
    const comment = getAttributeComment(attr);

    if (comment) {
      lines.push(`  /** ${comment} */`);
    }
    lines.push(`  ${name}${optional}: ${mappedType.type};`);
  }

  return lines.join('\n');
}
