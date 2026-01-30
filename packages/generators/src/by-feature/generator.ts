import path from 'node:path';
import type {
  ParsedSchema,
  CollectionType,
  SingleType,
  ComponentType,
  Attribute,
  StrapiLocale,
} from '@strapi2front/core';
import { formatCode } from '../utils/formatter.js';
import { writeFile, ensureDir } from '../utils/file.js';
import { toPascalCase, toCamelCase, toKebabCase } from '../utils/naming.js';

export interface ByFeatureGeneratorOptions {
  outputDir: string;
  features: {
    types: boolean;
    services: boolean;
    actions: boolean;
  };
  blocksRendererInstalled?: boolean;
  strapiVersion?: "v4" | "v5";
  apiPrefix?: string;
  /**
   * Output format: 'typescript' for .ts files, 'jsdoc' for .js with JSDoc annotations
   * @default 'typescript'
   */
  outputFormat?: "typescript" | "jsdoc";
}

/**
 * Generate all files using 'by-feature' structure
 *
 * Output structure:
 * strapi/
 *   collections/
 *     article/
 *       types.ts
 *       service.ts
 *       actions.ts
 *   singles/
 *     homepage/
 *       types.ts
 *       service.ts
 *   components/
 *     seo.ts
 *   shared/
 *     utils.ts
 *     client.ts
 *     locales.ts
 */
export async function generateByFeature(
  schema: ParsedSchema,
  locales: StrapiLocale[],
  options: ByFeatureGeneratorOptions
): Promise<string[]> {
  const {
    outputDir,
    features,
    blocksRendererInstalled = false,
    strapiVersion = "v5",
    apiPrefix = "/api",
    outputFormat = "typescript"
  } = options;
  const generatedFiles: string[] = [];

  // File extension based on output format
  const ext = outputFormat === "jsdoc" ? "js" : "ts";

  // Ensure directories exist
  await ensureDir(path.join(outputDir, 'collections'));
  await ensureDir(path.join(outputDir, 'singles'));
  await ensureDir(path.join(outputDir, 'components'));
  await ensureDir(path.join(outputDir, 'shared'));

  // Generate shared files
  const sharedDir = path.join(outputDir, 'shared');

  // Utils
  const utilsPath = path.join(sharedDir, `utils.${ext}`);
  const utilsContent = outputFormat === "jsdoc"
    ? generateUtilityTypesJSDoc(blocksRendererInstalled, strapiVersion)
    : generateUtilityTypes(blocksRendererInstalled, strapiVersion);
  await writeFile(utilsPath, await formatCode(utilsContent));
  generatedFiles.push(utilsPath);

  // Client
  const clientPath = path.join(sharedDir, `client.${ext}`);
  const clientContent = outputFormat === "jsdoc"
    ? generateClientJSDoc(strapiVersion, apiPrefix)
    : generateClient(strapiVersion, apiPrefix);
  await writeFile(clientPath, await formatCode(clientContent));
  generatedFiles.push(clientPath);

  // Locales
  const localesPath = path.join(sharedDir, `locales.${ext}`);
  const localesContent = outputFormat === "jsdoc"
    ? generateLocalesFileJSDoc(locales)
    : generateLocalesFile(locales);
  await writeFile(localesPath, await formatCode(localesContent));
  generatedFiles.push(localesPath);

  // Generate collection files
  for (const collection of schema.collections) {
    const featureDir = path.join(outputDir, 'collections', toKebabCase(collection.singularName));
    await ensureDir(featureDir);

    if (features.types) {
      const typesPath = path.join(featureDir, `types.${ext}`);
      const content = outputFormat === "jsdoc"
        ? generateCollectionTypesJSDoc(collection, schema)
        : generateCollectionTypes(collection, schema);
      await writeFile(typesPath, await formatCode(content));
      generatedFiles.push(typesPath);
    }

    if (features.services) {
      const servicePath = path.join(featureDir, `service.${ext}`);
      const content = outputFormat === "jsdoc"
        ? generateCollectionServiceJSDoc(collection, strapiVersion)
        : generateCollectionService(collection, strapiVersion);
      await writeFile(servicePath, await formatCode(content));
      generatedFiles.push(servicePath);
    }

    if (features.actions) {
      const actionsPath = path.join(featureDir, `actions.${ext}`);
      await writeFile(actionsPath, await formatCode(generateCollectionActions(collection, strapiVersion)));
      generatedFiles.push(actionsPath);
    }
  }

  // Generate single type files
  for (const single of schema.singles) {
    const featureDir = path.join(outputDir, 'singles', toKebabCase(single.singularName));
    await ensureDir(featureDir);

    if (features.types) {
      const typesPath = path.join(featureDir, `types.${ext}`);
      const content = outputFormat === "jsdoc"
        ? generateSingleTypesJSDoc(single, schema)
        : generateSingleTypes(single, schema);
      await writeFile(typesPath, await formatCode(content));
      generatedFiles.push(typesPath);
    }

    if (features.services) {
      const servicePath = path.join(featureDir, `service.${ext}`);
      const content = outputFormat === "jsdoc"
        ? generateSingleServiceJSDoc(single, strapiVersion)
        : generateSingleService(single, strapiVersion);
      await writeFile(servicePath, await formatCode(content));
      generatedFiles.push(servicePath);
    }
  }

  // Generate component files
  for (const component of schema.components) {
    const componentPath = path.join(outputDir, 'components', `${toKebabCase(component.name)}.${ext}`);
    const content = outputFormat === "jsdoc"
      ? generateComponentTypesJSDoc(component, schema)
      : generateComponentTypes(component, schema);
    await writeFile(componentPath, await formatCode(content));
    generatedFiles.push(componentPath);
  }

  return generatedFiles;
}

// ============================================
// Shared Files Generation
// ============================================

function generateUtilityTypes(blocksRendererInstalled: boolean, strapiVersion: "v4" | "v5"): string {
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
    ? `export interface StrapiBaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}`
    : `export interface StrapiBaseEntity {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}`;

  const mediaType = isV4
    ? `export interface StrapiMedia {
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
    : `export interface StrapiMedia {
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

  const v4RawResponseTypes = isV4 ? `

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
}` : '';

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

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: StrapiPagination;
  };
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: StrapiPagination;
  };
}

${baseEntity}
${v4RawResponseTypes}
${blocksContentType}
`;
}

function generateClient(strapiVersion: "v4" | "v5", apiPrefix: string = "/api"): string {
  const isV4 = strapiVersion === "v4";
  // Normalize prefix for the generated code
  const normalizedPrefix = apiPrefix.startsWith('/') ? apiPrefix : '/' + apiPrefix;

  if (isV4) {
    return `/**
 * Strapi Client (v4)
 * Generated by strapi2front
 */

import Strapi from 'strapi-sdk-js';
import type { StrapiPagination } from './utils';

// Initialize the Strapi client
const strapiUrl = import.meta.env.STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';
const strapiToken = import.meta.env.STRAPI_TOKEN || process.env.STRAPI_TOKEN;
const strapiApiPrefix = import.meta.env.STRAPI_API_PREFIX || process.env.STRAPI_API_PREFIX || '${normalizedPrefix}';

export const strapi = new Strapi({
  url: strapiUrl,
  prefix: strapiApiPrefix,
  axiosOptions: {
    headers: strapiToken ? {
      Authorization: \`Bearer \${strapiToken}\`,
    } : {},
  },
});

// Default pagination for fallback
const defaultPagination: StrapiPagination = {
  page: 1,
  pageSize: 25,
  pageCount: 1,
  total: 0,
};

// Strapi v4 raw response types (with nested attributes)
interface StrapiV4RawItem<T> {
  id: number;
  attributes: Omit<T, 'id'>;
}

interface StrapiV4RawListResponse<T> {
  data: StrapiV4RawItem<T>[];
  meta: {
    pagination?: StrapiPagination;
  };
}

interface StrapiV4RawSingleResponse<T> {
  data: StrapiV4RawItem<T>;
  meta?: Record<string, unknown>;
}

/**
 * Flatten a Strapi v4 response item (merges id with attributes)
 */
function flattenItem<T>(item: StrapiV4RawItem<T>): T {
  return { id: item.id, ...item.attributes } as T;
}

/**
 * Recursively flatten nested relations in Strapi v4 response
 */
function flattenRelations<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map(item => flattenRelations(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // Check if this is a Strapi v4 relation response { data: { id, attributes } }
      if (value && typeof value === 'object' && 'data' in value) {
        const relationData = (value as { data: unknown }).data;
        if (relationData === null) {
          result[key] = null;
        } else if (Array.isArray(relationData)) {
          // To-many relation
          result[key] = relationData.map((item: StrapiV4RawItem<unknown>) =>
            flattenRelations(flattenItem(item))
          );
        } else if (typeof relationData === 'object' && 'id' in relationData && 'attributes' in relationData) {
          // To-one relation
          result[key] = flattenRelations(flattenItem(relationData as StrapiV4RawItem<unknown>));
        } else {
          result[key] = flattenRelations(value);
        }
      } else {
        result[key] = flattenRelations(value);
      }
    }
    return result as T;
  }
  return data;
}

// Helper to get typed collection
export function collection<T>(pluralName: string) {
  return {
    async find(params?: Record<string, unknown>): Promise<{ data: T[]; meta: { pagination: StrapiPagination } }> {
      const response = await strapi.find(pluralName, params) as unknown as StrapiV4RawListResponse<T>;
      const flattenedData = Array.isArray(response.data)
        ? response.data.map(item => flattenRelations(flattenItem<T>(item)))
        : [];
      return {
        data: flattenedData,
        meta: {
          pagination: response.meta?.pagination || defaultPagination,
        },
      };
    },
    async findOne(id: number | string, params?: Record<string, unknown>): Promise<{ data: T }> {
      const response = await strapi.findOne(pluralName, String(id), params) as unknown as StrapiV4RawSingleResponse<T>;
      return { data: flattenRelations(flattenItem<T>(response.data)) };
    },
    async create(data: { data: Partial<T> }): Promise<{ data: T }> {
      const response = await strapi.create(pluralName, data.data as Record<string, unknown>) as unknown as StrapiV4RawSingleResponse<T>;
      return { data: flattenRelations(flattenItem<T>(response.data)) };
    },
    async update(id: number | string, data: { data: Partial<T> }): Promise<{ data: T }> {
      const response = await strapi.update(pluralName, String(id), data.data as Record<string, unknown>) as unknown as StrapiV4RawSingleResponse<T>;
      return { data: flattenRelations(flattenItem<T>(response.data)) };
    },
    async delete(id: number | string): Promise<void> {
      await strapi.delete(pluralName, String(id));
    },
  };
}

// Helper to get typed single type
export function single<T>(singularName: string) {
  return {
    async find(params?: Record<string, unknown>): Promise<{ data: T }> {
      const response = await strapi.find(singularName, params) as unknown as StrapiV4RawSingleResponse<T>;
      return { data: flattenRelations(flattenItem<T>(response.data)) };
    },
    async update(data: { data: Partial<T> }): Promise<{ data: T }> {
      const response = await strapi.update(singularName, 1 as unknown as string, data.data as Record<string, unknown>) as unknown as StrapiV4RawSingleResponse<T>;
      return { data: flattenRelations(flattenItem<T>(response.data)) };
    },
    async delete(): Promise<void> {
      await strapi.delete(singularName, 1 as unknown as string);
    },
  };
}
`;
  }

  return `/**
 * Strapi Client (v5)
 * Generated by strapi2front
 */

import Strapi from 'strapi-sdk-js';
import type { StrapiPagination } from './utils';

// Initialize the Strapi client
const strapiUrl = import.meta.env.STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';
const strapiToken = import.meta.env.STRAPI_TOKEN || process.env.STRAPI_TOKEN;
const strapiApiPrefix = import.meta.env.STRAPI_API_PREFIX || process.env.STRAPI_API_PREFIX || '${normalizedPrefix}';

export const strapi = new Strapi({
  url: strapiUrl,
  prefix: strapiApiPrefix,
  axiosOptions: {
    headers: strapiToken ? {
      Authorization: \`Bearer \${strapiToken}\`,
    } : {},
  },
});

// Default pagination for fallback
const defaultPagination: StrapiPagination = {
  page: 1,
  pageSize: 25,
  pageCount: 1,
  total: 0,
};

// Response types from strapi-sdk-js
interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination?: StrapiPagination;
  };
}

interface StrapiSingleResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// Helper to get typed collection
export function collection<T>(pluralName: string) {
  return {
    async find(params?: Record<string, unknown>): Promise<{ data: T[]; meta: { pagination: StrapiPagination } }> {
      const response = await strapi.find(pluralName, params) as unknown as StrapiListResponse<T>;
      return {
        data: Array.isArray(response.data) ? response.data : [],
        meta: {
          pagination: response.meta?.pagination || defaultPagination,
        },
      };
    },
    async findOne(documentId: string, params?: Record<string, unknown>): Promise<{ data: T }> {
      const response = await strapi.findOne(pluralName, documentId, params) as unknown as StrapiSingleResponse<T>;
      return { data: response.data };
    },
    async create(data: { data: Partial<T> }): Promise<{ data: T }> {
      const response = await strapi.create(pluralName, data.data as Record<string, unknown>) as unknown as StrapiSingleResponse<T>;
      return { data: response.data };
    },
    async update(documentId: string, data: { data: Partial<T> }): Promise<{ data: T }> {
      const response = await strapi.update(pluralName, documentId, data.data as Record<string, unknown>) as unknown as StrapiSingleResponse<T>;
      return { data: response.data };
    },
    async delete(documentId: string): Promise<void> {
      await strapi.delete(pluralName, documentId);
    },
  };
}

// Helper to get typed single type
export function single<T>(singularName: string) {
  return {
    async find(params?: Record<string, unknown>): Promise<{ data: T }> {
      const response = await strapi.find(singularName, params) as unknown as StrapiSingleResponse<T>;
      return { data: response.data };
    },
    async update(data: { data: Partial<T> }): Promise<{ data: T }> {
      const response = await strapi.update(singularName, 1 as unknown as string, data.data as Record<string, unknown>) as unknown as StrapiSingleResponse<T>;
      return { data: response.data };
    },
    async delete(): Promise<void> {
      await strapi.delete(singularName, 1 as unknown as string);
    },
  };
}
`;
}

function generateLocalesFile(locales: StrapiLocale[]): string {
  if (locales.length === 0) {
    return `/**
 * Strapi locales
 * Generated by strapi2front
 * Note: i18n is not enabled in Strapi
 */

export const locales = [] as const;
export type Locale = string;
export const defaultLocale: Locale = 'en';
export const localeNames: Record<string, string> = {};

export function isValidLocale(_code: string): _code is Locale {
  return true;
}

export function getLocaleName(code: string): string {
  return code;
}
`;
  }

  const localeCodes = locales.map(l => l.code);
  const defaultLocale = locales.find(l => l.isDefault)?.code || locales[0]?.code || 'en';

  return `/**
 * Strapi locales
 * Generated by strapi2front
 */

export const locales = [${localeCodes.map(c => `'${c}'`).join(', ')}] as const;

export type Locale = typeof locales[number];

export const defaultLocale: Locale = '${defaultLocale}';

export const localeNames: Record<Locale, string> = {
${locales.map(l => `  '${l.code}': '${l.name}'`).join(',\n')}
};

export function isValidLocale(code: string): code is Locale {
  return locales.includes(code as Locale);
}

export function getLocaleName(code: Locale): string {
  return localeNames[code] || code;
}
`;
}

// ============================================
// Collection Types Generation
// ============================================

function generateCollectionTypes(collection: CollectionType, schema: ParsedSchema): string {
  const typeName = toPascalCase(collection.singularName);
  const attributes = generateAttributes(collection.attributes);
  const imports = generateTypeImports(collection.attributes, schema, 'collection');

  return `/**
 * ${collection.displayName}
 * ${collection.description || ''}
 * Generated by strapi2front
 */

${imports}

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
`;
}

function generateSingleTypes(single: SingleType, schema: ParsedSchema): string {
  const typeName = toPascalCase(single.singularName);
  const attributes = generateAttributes(single.attributes);
  const imports = generateTypeImports(single.attributes, schema, 'single');

  return `/**
 * ${single.displayName}
 * ${single.description || ''}
 * Generated by strapi2front
 */

${imports}

export interface ${typeName} extends StrapiBaseEntity {
${attributes}
}
`;
}

function generateComponentTypes(component: ComponentType, schema: ParsedSchema): string {
  const typeName = toPascalCase(component.name);
  const attributes = generateAttributes(component.attributes);
  const imports = generateTypeImports(component.attributes, schema, 'component');

  return `/**
 * ${component.displayName} component
 * Category: ${component.category}
 * ${component.description || ''}
 * Generated by strapi2front
 */

${imports}

export interface ${typeName} {
  id: number;
${attributes}
}
`;
}

function generateTypeImports(
  attributes: Record<string, Attribute>,
  schema: ParsedSchema,
  context: 'collection' | 'single' | 'component'
): string {
  const utilsImports: string[] = [];
  const relationImports: Map<string, string> = new Map();
  const componentImports: Map<string, string> = new Map();

  // Check what utils we need
  const attributesStr = JSON.stringify(attributes);
  if (context !== 'component') {
    utilsImports.push('StrapiBaseEntity');
  }
  if (attributesStr.includes('"type":"media"')) {
    utilsImports.push('StrapiMedia');
  }
  if (attributesStr.includes('"type":"blocks"')) {
    utilsImports.push('BlocksContent');
  }

  // Extract relations and components
  // Components are in strapi/components/, collections/singles are in strapi/collections/xxx/ or strapi/singles/xxx/
  // From component: ../collections/xxx/types (one level up)
  // From collection/single: ../../collections/xxx/types (two levels up, since they're in a subfolder)
  const relativePrefix = context === 'component' ? '..' : '../..';

  for (const attr of Object.values(attributes)) {
    if (attr.type === 'relation' && 'target' in attr && attr.target) {
      const targetName = attr.target.split('.').pop() || '';
      if (targetName) {
        const typeName = toPascalCase(targetName);
        const fileName = toKebabCase(targetName);
        // Check if it's a collection or single
        const isCollection = schema.collections.some(c => c.singularName === targetName);
        const isSingle = schema.singles.some(s => s.singularName === targetName);
        if (isCollection) {
          relationImports.set(typeName, `${relativePrefix}/collections/${fileName}/types`);
        } else if (isSingle) {
          relationImports.set(typeName, `${relativePrefix}/singles/${fileName}/types`);
        }
      }
    }

    if (attr.type === 'component' && 'component' in attr && attr.component) {
      const componentName = attr.component.split('.').pop() || '';
      if (componentName) {
        const typeName = toPascalCase(componentName);
        const fileName = toKebabCase(componentName);
        if (context === 'component') {
          componentImports.set(typeName, `./${fileName}`);
        } else {
          componentImports.set(typeName, `../../components/${fileName}`);
        }
      }
    }

    if (attr.type === 'dynamiczone' && 'components' in attr && attr.components) {
      for (const comp of attr.components) {
        const componentName = comp.split('.').pop() || '';
        if (componentName) {
          const typeName = toPascalCase(componentName);
          const fileName = toKebabCase(componentName);
          if (context === 'component') {
            componentImports.set(typeName, `./${fileName}`);
          } else {
            componentImports.set(typeName, `../../components/${fileName}`);
          }
        }
      }
    }
  }

  const lines: string[] = [];

  // Utils import
  if (utilsImports.length > 0) {
    const utilsPath = context === 'component' ? '../shared/utils' : '../../shared/utils';
    lines.push(`import type { ${utilsImports.join(', ')} } from '${utilsPath}';`);
  }

  // Relation imports
  for (const [typeName, importPath] of relationImports) {
    lines.push(`import type { ${typeName} } from '${importPath}';`);
  }

  // Component imports
  for (const [typeName, importPath] of componentImports) {
    lines.push(`import type { ${typeName} } from '${importPath}';`);
  }

  return lines.join('\n');
}

function generateAttributes(attributes: Record<string, Attribute>): string {
  const lines: string[] = [];

  for (const [name, attr] of Object.entries(attributes)) {
    const tsType = attributeToTsType(attr);
    const optional = attr.required ? '' : '?';
    lines.push(`  ${name}${optional}: ${tsType};`);
  }

  return lines.join('\n');
}

function attributeToTsType(attr: Attribute): string {
  switch (attr.type) {
    case 'string':
    case 'text':
    case 'richtext':
    case 'email':
    case 'password':
    case 'uid':
      return 'string';
    case 'blocks':
      return 'BlocksContent';
    case 'integer':
    case 'biginteger':
    case 'float':
    case 'decimal':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
    case 'time':
    case 'datetime':
    case 'timestamp':
      return 'string';
    case 'json':
      return 'unknown';
    case 'enumeration':
      if ('enum' in attr && attr.enum) {
        return attr.enum.map(v => `'${v}'`).join(' | ');
      }
      return 'string';
    case 'media':
      if ('multiple' in attr && attr.multiple) {
        return 'StrapiMedia[]';
      }
      return 'StrapiMedia | null';
    case 'relation':
      if ('target' in attr && attr.target) {
        const targetName = toPascalCase(attr.target.split('.').pop() || 'unknown');
        const isMany = attr.relation === 'oneToMany' || attr.relation === 'manyToMany';
        return isMany ? `${targetName}[]` : `${targetName} | null`;
      }
      return 'unknown';
    case 'component':
      if ('component' in attr && attr.component) {
        const componentName = toPascalCase(attr.component.split('.').pop() || 'unknown');
        if ('repeatable' in attr && attr.repeatable) {
          return `${componentName}[]`;
        }
        return `${componentName} | null`;
      }
      return 'unknown';
    case 'dynamiczone':
      if ('components' in attr && attr.components) {
        const types = attr.components.map(c => toPascalCase(c.split('.').pop() || 'unknown'));
        return `(${types.join(' | ')})[]`;
      }
      return 'unknown[]';
    default:
      return 'unknown';
  }
}

// ============================================
// Collection Service Generation
// ============================================

function generateCollectionService(collection: CollectionType, strapiVersion: "v4" | "v5"): string {
  const typeName = toPascalCase(collection.singularName);
  const serviceName = toCamelCase(collection.singularName) + 'Service';
  const endpoint = collection.pluralName;
  const hasSlug = 'slug' in collection.attributes;
  const { localized, draftAndPublish } = collection;
  const isV4 = strapiVersion === "v4";

  // V4 uses `id: number`, V5 uses `documentId: string`
  const idParam = isV4 ? 'id: number' : 'documentId: string';
  const idName = isV4 ? 'id' : 'documentId';
  const omitFields = isV4
    ? "'id' | 'createdAt' | 'updatedAt' | 'publishedAt'"
    : "'id' | 'documentId' | 'createdAt' | 'updatedAt' | 'publishedAt'";
  const omitFieldsUpdate = isV4
    ? "'id' | 'createdAt' | 'updatedAt'"
    : "'id' | 'documentId' | 'createdAt' | 'updatedAt'";

  // Build imports
  const imports = [
    `import { collection } from '../../shared/client';`,
    `import type { ${typeName}, ${typeName}Filters } from './types';`,
    `import type { StrapiPagination } from '../../shared/utils';`,
  ];
  if (localized) {
    imports.push(`import type { Locale } from '../../shared/locales';`);
  }

  // Build options interfaces
  const paginationFields = `
    /** Page number (1-indexed) - use with pageSize */
    page?: number;
    /** Number of items per page (default: 25) - use with page */
    pageSize?: number;
    /** Offset to start from (0-indexed) - use with limit */
    start?: number;
    /** Maximum number of items to return - use with start */
    limit?: number;`;

  let findManyOptionsFields = `  filters?: ${typeName}Filters;
  pagination?: {${paginationFields}
  };
  sort?: string | string[];
  populate?: string | string[] | Record<string, unknown>;`;

  let findOneOptionsFields = `  populate?: string | string[] | Record<string, unknown>;`;

  if (localized) {
    findManyOptionsFields += `\n  locale?: Locale;`;
    findOneOptionsFields += `\n  locale?: Locale;`;
  }
  if (draftAndPublish) {
    findManyOptionsFields += `\n  status?: 'draft' | 'published';`;
    findOneOptionsFields += `\n  status?: 'draft' | 'published';`;
  }

  // Build find params
  let findParams = `      filters: options.filters,
      pagination: options.pagination,
      sort: options.sort,
      populate: options.populate,`;
  let findOneParams = `        populate: options.populate,`;

  if (localized) {
    findParams += `\n      locale: options.locale,`;
    findOneParams += `\n        locale: options.locale,`;
  }
  if (draftAndPublish) {
    findParams += `\n      status: options.status,`;
    findOneParams += `\n        status: options.status,`;
  }

  return `/**
 * ${collection.displayName} Service
 * ${collection.description || ''}
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

${imports.join('\n')}

export interface FindManyOptions {
${findManyOptionsFields}
}

export interface FindOneOptions {
${findOneOptionsFields}
}

// Create typed collection helper
const ${toCamelCase(collection.singularName)}Collection = collection<${typeName}>('${endpoint}');

export const ${serviceName} = {
  async findMany(options: FindManyOptions = {}): Promise<{ data: ${typeName}[]; pagination: StrapiPagination }> {
    const response = await ${toCamelCase(collection.singularName)}Collection.find({
${findParams}
    });

    return {
      data: response.data,
      pagination: response.meta.pagination,
    };
  },

  async findAll(options: Omit<FindManyOptions, 'pagination'> = {}): Promise<${typeName}[]> {
    const allItems: ${typeName}[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data, pagination } = await this.findMany({
        ...options,
        pagination: { page, pageSize: 100 },
      });

      allItems.push(...data);
      hasMore = page < pagination.pageCount;
      page++;
    }

    return allItems;
  },

  async findOne(${idParam}, options: FindOneOptions = {}): Promise<${typeName} | null> {
    try {
      const response = await ${toCamelCase(collection.singularName)}Collection.findOne(${idName}, {
${findOneParams}
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },
${hasSlug ? `
  async findBySlug(slug: string, options: FindOneOptions = {}): Promise<${typeName} | null> {
    const { data } = await this.findMany({
      filters: { slug: { $eq: slug } } as ${typeName}Filters,
      pagination: { pageSize: 1 },
      populate: options.populate,${localized ? '\n      locale: options.locale,' : ''}${draftAndPublish ? '\n      status: options.status,' : ''}
    });

    return data[0] || null;
  },
` : ''}
  async create(data: Partial<Omit<${typeName}, ${omitFields}>>): Promise<${typeName}> {
    const response = await ${toCamelCase(collection.singularName)}Collection.create({ data });
    return response.data;
  },

  async update(${idParam}, data: Partial<Omit<${typeName}, ${omitFieldsUpdate}>>): Promise<${typeName}> {
    const response = await ${toCamelCase(collection.singularName)}Collection.update(${idName}, { data });
    return response.data;
  },

  async delete(${idParam}): Promise<void> {
    await ${toCamelCase(collection.singularName)}Collection.delete(${idName});
  },

  async count(filters?: ${typeName}Filters): Promise<number> {
    const { pagination } = await this.findMany({
      filters,
      pagination: { pageSize: 1 },
    });

    return pagination.total;
  },
};
`;
}

// ============================================
// Single Service Generation
// ============================================

function generateSingleService(single: SingleType, strapiVersion: "v4" | "v5"): string {
  const typeName = toPascalCase(single.singularName);
  const serviceName = toCamelCase(single.singularName) + 'Service';
  const endpoint = single.singularName;
  const { localized, draftAndPublish } = single;
  const isV4 = strapiVersion === "v4";

  // V4 doesn't have documentId
  const omitFields = isV4
    ? "'id' | 'createdAt' | 'updatedAt'"
    : "'id' | 'documentId' | 'createdAt' | 'updatedAt'";

  // Build imports
  const imports = [
    `import { single } from '../../shared/client';`,
    `import type { ${typeName} } from './types';`,
  ];
  if (localized) {
    imports.push(`import type { Locale } from '../../shared/locales';`);
  }

  // Build options interface
  let findOptionsFields = `  populate?: string | string[] | Record<string, unknown>;`;
  if (localized) {
    findOptionsFields += `\n  locale?: Locale;`;
  }
  if (draftAndPublish) {
    findOptionsFields += `\n  status?: 'draft' | 'published';`;
  }

  // Build find params
  let findParams = `        populate: options.populate,`;
  if (localized) {
    findParams += `\n        locale: options.locale,`;
  }
  if (draftAndPublish) {
    findParams += `\n        status: options.status,`;
  }

  return `/**
 * ${single.displayName} Service (Single Type)
 * ${single.description || ''}
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

${imports.join('\n')}

export interface FindOptions {
${findOptionsFields}
}

// Create typed single helper
const ${toCamelCase(single.singularName)}Single = single<${typeName}>('${endpoint}');

export const ${serviceName} = {
  async find(options: FindOptions = {}): Promise<${typeName} | null> {
    try {
      const response = await ${toCamelCase(single.singularName)}Single.find({
${findParams}
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async update(data: Partial<Omit<${typeName}, ${omitFields}>>): Promise<${typeName}> {
    const response = await ${toCamelCase(single.singularName)}Single.update({ data });
    return response.data;
  },

  async delete(): Promise<void> {
    await ${toCamelCase(single.singularName)}Single.delete();
  },
};
`;
}

// ============================================
// Collection Actions Generation
// ============================================

function generateCollectionActions(collection: CollectionType, strapiVersion: "v4" | "v5"): string {
  const typeName = toPascalCase(collection.singularName);
  const serviceName = toCamelCase(collection.singularName) + 'Service';
  const actionPrefix = toCamelCase(collection.singularName);
  const isV4 = strapiVersion === "v4";

  // V4 uses `id: number`, V5 uses `documentId: string`
  const idInputSchema = isV4 ? 'z.number().int().positive()' : 'z.string()';
  const idParamName = isV4 ? 'id' : 'documentId';

  return `/**
 * ${collection.displayName} Astro Actions
 * ${collection.description || ''}
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { ${serviceName} } from './service';
import type { ${typeName} } from './types';

export const ${actionPrefix}Actions = {
  getMany: defineAction({
    input: z.object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      sort: z.string().optional(),
    }).optional(),
    handler: async (input) => {
      const { data, pagination } = await ${serviceName}.findMany({
        pagination: input ? { page: input.page, pageSize: input.pageSize } : undefined,
        sort: input?.sort,
      });
      return { data, pagination };
    },
  }),

  getOne: defineAction({
    input: z.object({
      ${idParamName}: ${idInputSchema},
    }),
    handler: async (input) => {
      const data = await ${serviceName}.findOne(input.${idParamName});
      return { data };
    },
  }),

  create: defineAction({
    input: z.object({
      data: z.record(z.unknown()),
    }),
    handler: async (input) => {
      const data = await ${serviceName}.create(input.data as Partial<${typeName}>);
      return { data };
    },
  }),

  update: defineAction({
    input: z.object({
      ${idParamName}: ${idInputSchema},
      data: z.record(z.unknown()),
    }),
    handler: async (input) => {
      const data = await ${serviceName}.update(input.${idParamName}, input.data as Partial<${typeName}>);
      return { data };
    },
  }),

  delete: defineAction({
    input: z.object({
      ${idParamName}: ${idInputSchema},
    }),
    handler: async (input) => {
      await ${serviceName}.delete(input.${idParamName});
      return { success: true };
    },
  }),
};
`;
}

// ============================================
// JSDoc Generators
// ============================================

function generateUtilityTypesJSDoc(blocksRendererInstalled: boolean, strapiVersion: "v4" | "v5"): string {
  const isV4 = strapiVersion === "v4";

  const blocksContentType = isV4
    ? `/**
 * Rich text content (Strapi v4)
 * Can be markdown string or custom JSON structure
 * @typedef {string} RichTextContent
 */`
    : blocksRendererInstalled
    ? `// BlocksContent - import from '@strapi/blocks-react-renderer' for full type support`
    : `/**
 * Blocks content type (Strapi v5 rich text)
 *
 * For full type support and rendering, install:
 * npm install @strapi/blocks-react-renderer
 *
 * Then re-run: npx strapi2front sync
 * @typedef {Array<Object>} BlocksContent
 */`;

  const baseEntity = isV4
    ? `/**
 * @typedef {Object} StrapiBaseEntity
 * @property {number} id
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} publishedAt
 */`
    : `/**
 * @typedef {Object} StrapiBaseEntity
 * @property {number} id
 * @property {string} documentId
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} publishedAt
 */`;

  const mediaType = isV4
    ? `/**
 * @typedef {Object} StrapiMedia
 * @property {number} id
 * @property {string} name
 * @property {string|null} alternativeText
 * @property {string|null} caption
 * @property {number} width
 * @property {number} height
 * @property {Object|null} formats
 * @property {StrapiMediaFormat} [formats.thumbnail]
 * @property {StrapiMediaFormat} [formats.small]
 * @property {StrapiMediaFormat} [formats.medium]
 * @property {StrapiMediaFormat} [formats.large]
 * @property {string} hash
 * @property {string} ext
 * @property {string} mime
 * @property {number} size
 * @property {string} url
 * @property {string|null} previewUrl
 * @property {string} provider
 * @property {string} createdAt
 * @property {string} updatedAt
 */`
    : `/**
 * @typedef {Object} StrapiMedia
 * @property {number} id
 * @property {string} documentId
 * @property {string} name
 * @property {string|null} alternativeText
 * @property {string|null} caption
 * @property {number} width
 * @property {number} height
 * @property {Object|null} formats
 * @property {StrapiMediaFormat} [formats.thumbnail]
 * @property {StrapiMediaFormat} [formats.small]
 * @property {StrapiMediaFormat} [formats.medium]
 * @property {StrapiMediaFormat} [formats.large]
 * @property {string} hash
 * @property {string} ext
 * @property {string} mime
 * @property {number} size
 * @property {string} url
 * @property {string|null} previewUrl
 * @property {string} provider
 * @property {string} createdAt
 * @property {string} updatedAt
 */`;

  const v4RawResponseTypes = isV4 ? `

/**
 * Strapi v4 raw API response item (with nested attributes)
 * @template T
 * @typedef {Object} StrapiV4RawItem
 * @property {number} id
 * @property {Omit<T, 'id'>} attributes
 */

/**
 * Strapi v4 raw API response
 * @template T
 * @typedef {Object} StrapiV4RawResponse
 * @property {StrapiV4RawItem<T>} data
 * @property {Object} meta
 */

/**
 * Strapi v4 raw list response
 * @template T
 * @typedef {Object} StrapiV4RawListResponse
 * @property {StrapiV4RawItem<T>[]} data
 * @property {Object} meta
 * @property {StrapiPagination} meta.pagination
 */

/**
 * Flatten Strapi v4 response item
 * @template T
 * @param {StrapiV4RawItem<T>} item
 * @returns {T}
 */
function flattenV4Response(item) {
  /** @type {any} */
  const merged = { id: item.id, ...item.attributes };
  return merged;
}

/**
 * Flatten Strapi v4 list response
 * @template T
 * @param {StrapiV4RawItem<T>[]} items
 * @returns {T[]}
 */
function flattenV4ListResponse(items) {
  return items.map(item => flattenV4Response(item));
}

module.exports = { flattenV4Response, flattenV4ListResponse };` : '';

  return `// @ts-check
/**
 * Strapi utility types
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

${mediaType}

/**
 * @typedef {Object} StrapiMediaFormat
 * @property {string} name
 * @property {string} hash
 * @property {string} ext
 * @property {string} mime
 * @property {number} width
 * @property {number} height
 * @property {number} size
 * @property {string} url
 */

/**
 * @typedef {Object} StrapiPagination
 * @property {number} page
 * @property {number} pageSize
 * @property {number} pageCount
 * @property {number} total
 */

/**
 * @template T
 * @typedef {Object} StrapiResponse
 * @property {T} data
 * @property {Object} meta
 * @property {StrapiPagination} [meta.pagination]
 */

/**
 * @template T
 * @typedef {Object} StrapiListResponse
 * @property {T[]} data
 * @property {Object} meta
 * @property {StrapiPagination} meta.pagination
 */

${baseEntity}
${v4RawResponseTypes}
${blocksContentType}

module.exports = {};
`;
}

function generateClientJSDoc(strapiVersion: "v4" | "v5", apiPrefix: string = "/api"): string {
  const isV4 = strapiVersion === "v4";
  const normalizedPrefix = apiPrefix.startsWith('/') ? apiPrefix : '/' + apiPrefix;

  if (isV4) {
    return `// @ts-check
/**
 * Strapi Client (v4)
 * Generated by strapi2front
 */

const Strapi = require('strapi-sdk-js').default;

// Initialize the Strapi client
const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
const strapiToken = process.env.STRAPI_TOKEN;
const strapiApiPrefix = process.env.STRAPI_API_PREFIX || '${normalizedPrefix}';

const strapi = new Strapi({
  url: strapiUrl,
  prefix: strapiApiPrefix,
  axiosOptions: {
    headers: strapiToken ? {
      Authorization: \`Bearer \${strapiToken}\`,
    } : {},
  },
});

/** @type {import('./utils').StrapiPagination} */
const defaultPagination = {
  page: 1,
  pageSize: 25,
  pageCount: 1,
  total: 0,
};

/**
 * Flatten a Strapi v4 response item (merges id with attributes)
 * @template T
 * @param {{ id: number, attributes: Omit<T, 'id'> }} item
 * @returns {T}
 */
function flattenItem(item) {
  /** @type {any} */
  const merged = { id: item.id, ...item.attributes };
  return merged;
}

/**
 * Recursively flatten nested relations in Strapi v4 response
 * @template T
 * @param {T} data
 * @returns {T}
 */
function flattenRelations(data) {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    /** @type {any} */
    const mapped = data.map(item => flattenRelations(item));
    return mapped;
  }
  if (typeof data === 'object') {
    /** @type {Record<string, unknown>} */
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'data' in value) {
        /** @type {any} */
        const wrapper = value;
        const relationData = wrapper.data;
        if (relationData === null) {
          result[key] = null;
        } else if (Array.isArray(relationData)) {
          result[key] = relationData.map((item) =>
            flattenRelations(flattenItem(item))
          );
        } else if (typeof relationData === 'object' && relationData !== null && 'id' in relationData && 'attributes' in relationData) {
          result[key] = flattenRelations(flattenItem(relationData));
        } else {
          result[key] = flattenRelations(value);
        }
      } else {
        result[key] = flattenRelations(value);
      }
    }
    /** @type {any} */
    const typed = result;
    return typed;
  }
  return data;
}

/**
 * Helper to get typed collection
 * @template T
 * @param {string} pluralName
 */
function collection(pluralName) {
  return {
    /**
     * @param {Record<string, unknown>} [params]
     * @returns {Promise<{ data: T[], meta: { pagination: import('./utils').StrapiPagination } }>}
     */
    async find(params) {
      const response = await strapi.find(pluralName, params);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T[]} */
      const data = Array.isArray(rawData)
        ? rawData.map(item => flattenRelations(flattenItem(item)))
        : [];
      /** @type {any} */
      const rawMeta = response.meta;
      /** @type {any} */
      const rawPag = rawMeta?.pagination;
      /** @type {import('./utils').StrapiPagination} */
      const pagination = {
        page: rawPag?.page ?? defaultPagination.page,
        pageSize: rawPag?.pageSize ?? defaultPagination.pageSize,
        pageCount: rawPag?.pageCount ?? defaultPagination.pageCount,
        total: rawPag?.total ?? defaultPagination.total,
      };
      return { data, meta: { pagination } };
    },
    /**
     * @param {number|string} id
     * @param {Record<string, unknown>} [params]
     * @returns {Promise<{ data: T }>}
     */
    async findOne(id, params) {
      const response = await strapi.findOne(pluralName, String(id), params);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const data = flattenRelations(flattenItem(rawData));
      return { data };
    },
    /**
     * @param {{ data: Partial<T> }} data
     * @returns {Promise<{ data: T }>}
     */
    async create(data) {
      const response = await strapi.create(pluralName, data.data);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const result = flattenRelations(flattenItem(rawData));
      return { data: result };
    },
    /**
     * @param {number|string} id
     * @param {{ data: Partial<T> }} data
     * @returns {Promise<{ data: T }>}
     */
    async update(id, data) {
      const response = await strapi.update(pluralName, String(id), data.data);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const result = flattenRelations(flattenItem(rawData));
      return { data: result };
    },
    /**
     * @param {number|string} id
     * @returns {Promise<void>}
     */
    async delete(id) {
      await strapi.delete(pluralName, String(id));
    },
  };
}

/**
 * Helper to get typed single type
 * @template T
 * @param {string} singularName
 */
function single(singularName) {
  return {
    /**
     * @param {Record<string, unknown>} [params]
     * @returns {Promise<{ data: T }>}
     */
    async find(params) {
      const response = await strapi.find(singularName, params);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const data = flattenRelations(flattenItem(rawData));
      return { data };
    },
    /**
     * @param {{ data: Partial<T> }} data
     * @returns {Promise<{ data: T }>}
     */
    async update(data) {
      const response = await strapi.update(singularName, String(1), data.data);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const result = flattenRelations(flattenItem(rawData));
      return { data: result };
    },
    /**
     * @returns {Promise<void>}
     */
    async delete() {
      await strapi.delete(singularName, String(1));
    },
  };
}

module.exports = { strapi, collection, single };
`;
  }

  return `// @ts-check
/**
 * Strapi Client (v5)
 * Generated by strapi2front
 */

const Strapi = require('strapi-sdk-js').default;

// Initialize the Strapi client
const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
const strapiToken = process.env.STRAPI_TOKEN;
const strapiApiPrefix = process.env.STRAPI_API_PREFIX || '${normalizedPrefix}';

const strapi = new Strapi({
  url: strapiUrl,
  prefix: strapiApiPrefix,
  axiosOptions: {
    headers: strapiToken ? {
      Authorization: \`Bearer \${strapiToken}\`,
    } : {},
  },
});

/** @type {import('./utils').StrapiPagination} */
const defaultPagination = {
  page: 1,
  pageSize: 25,
  pageCount: 1,
  total: 0,
};

/**
 * Helper to get typed collection
 * @template T
 * @param {string} pluralName
 */
function collection(pluralName) {
  return {
    /**
     * @param {Record<string, unknown>} [params]
     * @returns {Promise<{ data: T[], meta: { pagination: import('./utils').StrapiPagination } }>}
     */
    async find(params) {
      const response = await strapi.find(pluralName, params);
      /** @type {any} */
      const rawMeta = response.meta;
      /** @type {any} */
      const rawPag = rawMeta?.pagination;
      /** @type {import('./utils').StrapiPagination} */
      const pagination = {
        page: rawPag?.page ?? defaultPagination.page,
        pageSize: rawPag?.pageSize ?? defaultPagination.pageSize,
        pageCount: rawPag?.pageCount ?? defaultPagination.pageCount,
        total: rawPag?.total ?? defaultPagination.total,
      };
      /** @type {any} */
      const rawData = response.data;
      /** @type {T[]} */
      const data = Array.isArray(rawData) ? rawData : [];
      return { data, meta: { pagination } };
    },
    /**
     * @param {string} documentId
     * @param {Record<string, unknown>} [params]
     * @returns {Promise<{ data: T }>}
     */
    async findOne(documentId, params) {
      const response = await strapi.findOne(pluralName, documentId, params);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const data = rawData;
      return { data };
    },
    /**
     * @param {{ data: Partial<T> }} data
     * @returns {Promise<{ data: T }>}
     */
    async create(data) {
      const response = await strapi.create(pluralName, data.data);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const result = rawData;
      return { data: result };
    },
    /**
     * @param {string} documentId
     * @param {{ data: Partial<T> }} data
     * @returns {Promise<{ data: T }>}
     */
    async update(documentId, data) {
      const response = await strapi.update(pluralName, documentId, data.data);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const result = rawData;
      return { data: result };
    },
    /**
     * @param {string} documentId
     * @returns {Promise<void>}
     */
    async delete(documentId) {
      await strapi.delete(pluralName, documentId);
    },
  };
}

/**
 * Helper to get typed single type
 * @template T
 * @param {string} singularName
 */
function single(singularName) {
  return {
    /**
     * @param {Record<string, unknown>} [params]
     * @returns {Promise<{ data: T }>}
     */
    async find(params) {
      const response = await strapi.find(singularName, params);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const data = rawData;
      return { data };
    },
    /**
     * @param {{ data: Partial<T> }} data
     * @returns {Promise<{ data: T }>}
     */
    async update(data) {
      const response = await strapi.update(singularName, String(1), data.data);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const result = rawData;
      return { data: result };
    },
    /**
     * @returns {Promise<void>}
     */
    async delete() {
      await strapi.delete(singularName, String(1));
    },
  };
}

module.exports = { strapi, collection, single };
`;
}

function generateLocalesFileJSDoc(locales: StrapiLocale[]): string {
  if (locales.length === 0) {
    return `// @ts-check
/**
 * Strapi locales
 * Generated by strapi2front
 * Note: i18n is not enabled in Strapi
 */

/** @type {readonly string[]} */
const locales = [];

/** @typedef {string} Locale */

/** @type {string} */
const defaultLocale = 'en';

/** @type {Record<string, string>} */
const localeNames = {};

/**
 * @param {string} _code
 * @returns {boolean}
 */
function isValidLocale(_code) {
  return true;
}

/**
 * @param {string} code
 * @returns {string}
 */
function getLocaleName(code) {
  return code;
}

module.exports = { locales, defaultLocale, localeNames, isValidLocale, getLocaleName };
`;
  }

  const localeCodes = locales.map(l => l.code);
  const defaultLocale = locales.find(l => l.isDefault)?.code || locales[0]?.code || 'en';

  return `// @ts-check
/**
 * Strapi locales
 * Generated by strapi2front
 */

/** @type {readonly [${localeCodes.map(c => `'${c}'`).join(', ')}]} */
const locales = [${localeCodes.map(c => `'${c}'`).join(', ')}];

/** @typedef {${localeCodes.map(c => `'${c}'`).join(' | ')}} Locale */

/** @type {Locale} */
const defaultLocale = '${defaultLocale}';

/** @type {Record<Locale, string>} */
const localeNames = {
${locales.map(l => `  '${l.code}': '${l.name}'`).join(',\n')}
};

/**
 * @param {string} code
 * @returns {boolean}
 */
function isValidLocale(code) {
  /** @type {readonly string[]} */
  const localeList = locales;
  return localeList.includes(code);
}

/**
 * @param {Locale} code
 * @returns {string}
 */
function getLocaleName(code) {
  return localeNames[code] || code;
}

module.exports = { locales, defaultLocale, localeNames, isValidLocale, getLocaleName };
`;
}

// ============================================
// JSDoc Collection Types Generation
// ============================================

function generateCollectionTypesJSDoc(collection: CollectionType, schema: ParsedSchema): string {
  const typeName = toPascalCase(collection.singularName);
  const attributes = generateJSDocAttributes(collection.attributes, schema, 'collection');

  return `// @ts-check
/**
 * ${collection.displayName}
 * ${collection.description || ''}
 * Generated by strapi2front
 */

/**
 * @typedef {import('../../shared/utils').StrapiBaseEntity & ${typeName}Attributes} ${typeName}
 */

/**
 * @typedef {Object} ${typeName}Attributes
${attributes}
 */

/**
 * @typedef {Object} ${typeName}Filters
 * @property {number|{$eq?: number, $ne?: number, $in?: number[], $notIn?: number[]}} [id]
 * @property {string|{$eq?: string, $ne?: string}} [documentId]
 * @property {string|{$eq?: string, $gt?: string, $gte?: string, $lt?: string, $lte?: string}} [createdAt]
 * @property {string|{$eq?: string, $gt?: string, $gte?: string, $lt?: string, $lte?: string}} [updatedAt]
 * @property {string|null|{$eq?: string, $ne?: string, $null?: boolean}} [publishedAt]
 * @property {${typeName}Filters[]} [$and]
 * @property {${typeName}Filters[]} [$or]
 * @property {${typeName}Filters} [$not]
 */

module.exports = {};
`;
}

function generateSingleTypesJSDoc(single: SingleType, schema: ParsedSchema): string {
  const typeName = toPascalCase(single.singularName);
  const attributes = generateJSDocAttributes(single.attributes, schema, 'single');

  return `// @ts-check
/**
 * ${single.displayName}
 * ${single.description || ''}
 * Generated by strapi2front
 */

/**
 * @typedef {import('../../shared/utils').StrapiBaseEntity & ${typeName}Attributes} ${typeName}
 */

/**
 * @typedef {Object} ${typeName}Attributes
${attributes}
 */

module.exports = {};
`;
}

function generateComponentTypesJSDoc(component: ComponentType, schema: ParsedSchema): string {
  const typeName = toPascalCase(component.name);
  const attributes = generateJSDocAttributes(component.attributes, schema, 'component');

  return `// @ts-check
/**
 * ${component.displayName} component
 * Category: ${component.category}
 * ${component.description || ''}
 * Generated by strapi2front
 */

/**
 * @typedef {Object} ${typeName}
 * @property {number} id
${attributes}
 */

module.exports = {};
`;
}

function generateJSDocAttributes(
  attributes: Record<string, Attribute>,
  schema: ParsedSchema,
  context: 'collection' | 'single' | 'component'
): string {
  const lines: string[] = [];
  const relativePrefix = context === 'component' ? '..' : '../..';

  for (const [name, attr] of Object.entries(attributes)) {
    const jsType = attributeToJSDocType(attr, schema, relativePrefix);
    const optional = attr.required ? '' : '[';
    const optionalEnd = attr.required ? '' : ']';
    lines.push(` * @property {${jsType}} ${optional}${name}${optionalEnd}`);
  }

  return lines.join('\n');
}

function attributeToJSDocType(
  attr: Attribute,
  schema: ParsedSchema,
  relativePrefix: string
): string {
  switch (attr.type) {
    case 'string':
    case 'text':
    case 'richtext':
    case 'email':
    case 'password':
    case 'uid':
      return 'string';
    case 'blocks':
      return 'Array<Object>';
    case 'integer':
    case 'biginteger':
    case 'float':
    case 'decimal':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
    case 'time':
    case 'datetime':
    case 'timestamp':
      return 'string';
    case 'json':
      return 'Object';
    case 'enumeration':
      if ('enum' in attr && attr.enum) {
        return attr.enum.map(v => `'${v}'`).join('|');
      }
      return 'string';
    case 'media':
      if ('multiple' in attr && attr.multiple) {
        return `import("${relativePrefix}/shared/utils").StrapiMedia[]`;
      }
      return `import("${relativePrefix}/shared/utils").StrapiMedia|null`;
    case 'relation':
      if ('target' in attr && attr.target) {
        const targetName = attr.target.split('.').pop() || 'unknown';
        const typeName = toPascalCase(targetName);
        const fileName = toKebabCase(targetName);
        const isMany = attr.relation === 'oneToMany' || attr.relation === 'manyToMany';

        // Determine if target is a collection or single
        const isCollection = schema.collections.some(c => c.singularName === targetName);
        const isSingle = schema.singles.some(s => s.singularName === targetName);

        let importPath: string;
        if (isCollection) {
          importPath = `${relativePrefix}/collections/${fileName}/types`;
        } else if (isSingle) {
          importPath = `${relativePrefix}/singles/${fileName}/types`;
        } else {
          // Fallback - assume collection
          importPath = `${relativePrefix}/collections/${fileName}/types`;
        }

        const importType = `import("${importPath}").${typeName}`;
        return isMany ? `${importType}[]` : `${importType}|null`;
      }
      return 'Object';
    case 'component':
      if ('component' in attr && attr.component) {
        const componentName = attr.component.split('.').pop() || 'unknown';
        const typeName = toPascalCase(componentName);
        const fileName = toKebabCase(componentName);
        const importPath = `${relativePrefix}/components/${fileName}`;
        const importType = `import("${importPath}").${typeName}`;

        if ('repeatable' in attr && attr.repeatable) {
          return `${importType}[]`;
        }
        return `${importType}|null`;
      }
      return 'Object';
    case 'dynamiczone':
      if ('components' in attr && attr.components) {
        const types = attr.components.map(comp => {
          const componentName = comp.split('.').pop() || 'unknown';
          const typeName = toPascalCase(componentName);
          const fileName = toKebabCase(componentName);
          const importPath = `${relativePrefix}/components/${fileName}`;
          return `import("${importPath}").${typeName}`;
        });
        return `(${types.join('|')})[]`;
      }
      return 'Object[]';
    default:
      return 'Object';
  }
}

// ============================================
// JSDoc Collection Service Generation
// ============================================

function generateCollectionServiceJSDoc(collection: CollectionType, strapiVersion: "v4" | "v5"): string {
  const typeName = toPascalCase(collection.singularName);
  const serviceName = toCamelCase(collection.singularName) + 'Service';
  const endpoint = collection.pluralName;
  const hasSlug = 'slug' in collection.attributes;
  const { localized, draftAndPublish } = collection;
  const isV4 = strapiVersion === "v4";

  // V4 uses `id: number`, V5 uses `documentId: string`
  const idParam = isV4 ? 'id' : 'documentId';
  const idType = isV4 ? 'number' : 'string';

  return `// @ts-check
/**
 * ${collection.displayName} Service
 * ${collection.description || ''}
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

const { collection } = require('../../shared/client');

/**
 * @typedef {Object} FindManyOptions
 * @property {import('./types').${typeName}Filters} [filters]
 * @property {Object} [pagination]
 * @property {number} [pagination.page]
 * @property {number} [pagination.pageSize]
 * @property {number} [pagination.start]
 * @property {number} [pagination.limit]
 * @property {string|string[]} [sort]
 * @property {string|string[]|Record<string, unknown>} [populate]${localized ? '\n * @property {string} [locale]' : ''}${draftAndPublish ? "\n * @property {'draft'|'published'} [status]" : ''}
 */

/**
 * @typedef {Object} FindOneOptions
 * @property {string|string[]|Record<string, unknown>} [populate]${localized ? '\n * @property {string} [locale]' : ''}${draftAndPublish ? "\n * @property {'draft'|'published'} [status]" : ''}
 */

/** @type {ReturnType<typeof collection<import('./types').${typeName}>>} */
const ${toCamelCase(collection.singularName)}Collection = collection('${endpoint}');

const ${serviceName} = {
  /**
   * @param {FindManyOptions} [options]
   * @returns {Promise<{ data: import('./types').${typeName}[], pagination: import('../../shared/utils').StrapiPagination }>}
   */
  async findMany(options = {}) {
    const response = await ${toCamelCase(collection.singularName)}Collection.find({
      filters: options.filters,
      pagination: options.pagination,
      sort: options.sort,
      populate: options.populate,${localized ? '\n      locale: options.locale,' : ''}${draftAndPublish ? '\n      status: options.status,' : ''}
    });

    return {
      data: response.data,
      pagination: response.meta.pagination,
    };
  },

  /**
   * @param {Omit<FindManyOptions, 'pagination'>} [options]
   * @returns {Promise<import('./types').${typeName}[]>}
   */
  async findAll(options = {}) {
    /** @type {import('./types').${typeName}[]} */
    const allItems = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data, pagination } = await this.findMany({
        ...options,
        pagination: { page, pageSize: 100 },
      });

      allItems.push(...data);
      hasMore = page < pagination.pageCount;
      page++;
    }

    return allItems;
  },

  /**
   * @param {${idType}} ${idParam}
   * @param {FindOneOptions} [options]
   * @returns {Promise<import('./types').${typeName}|null>}
   */
  async findOne(${idParam}, options = {}) {
    try {
      const response = await ${toCamelCase(collection.singularName)}Collection.findOne(${idParam}, {
        populate: options.populate,${localized ? '\n        locale: options.locale,' : ''}${draftAndPublish ? '\n        status: options.status,' : ''}
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },
${hasSlug ? `
  /**
   * @param {string} slug
   * @param {FindOneOptions} [options]
   * @returns {Promise<import('./types').${typeName}|null>}
   */
  async findBySlug(slug, options = {}) {
    const { data } = await this.findMany({
      filters: /** @type {import('./types').${typeName}Filters} */ ({ slug: { $eq: slug } }),
      pagination: { pageSize: 1 },
      populate: options.populate,${localized ? '\n      locale: options.locale,' : ''}${draftAndPublish ? '\n      status: options.status,' : ''}
    });

    return data[0] || null;
  },
` : ''}
  /**
   * @param {Partial<import('./types').${typeName}>} data
   * @returns {Promise<import('./types').${typeName}>}
   */
  async create(data) {
    const response = await ${toCamelCase(collection.singularName)}Collection.create({ data });
    return response.data;
  },

  /**
   * @param {${idType}} ${idParam}
   * @param {Partial<import('./types').${typeName}>} data
   * @returns {Promise<import('./types').${typeName}>}
   */
  async update(${idParam}, data) {
    const response = await ${toCamelCase(collection.singularName)}Collection.update(${idParam}, { data });
    return response.data;
  },

  /**
   * @param {${idType}} ${idParam}
   * @returns {Promise<void>}
   */
  async delete(${idParam}) {
    await ${toCamelCase(collection.singularName)}Collection.delete(${idParam});
  },

  /**
   * @param {import('./types').${typeName}Filters} [filters]
   * @returns {Promise<number>}
   */
  async count(filters) {
    const { pagination } = await this.findMany({
      filters,
      pagination: { pageSize: 1 },
    });

    return pagination.total;
  },
};

module.exports = { ${serviceName} };
`;
}

// ============================================
// JSDoc Single Service Generation
// ============================================

function generateSingleServiceJSDoc(single: SingleType, strapiVersion: "v4" | "v5"): string {
  const typeName = toPascalCase(single.singularName);
  const serviceName = toCamelCase(single.singularName) + 'Service';
  const endpoint = single.singularName;
  const { localized, draftAndPublish } = single;

  return `// @ts-check
/**
 * ${single.displayName} Service (Single Type)
 * ${single.description || ''}
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

const { single } = require('../../shared/client');

/**
 * @typedef {Object} FindOptions
 * @property {string|string[]|Record<string, unknown>} [populate]${localized ? '\n * @property {string} [locale]' : ''}${draftAndPublish ? "\n * @property {'draft'|'published'} [status]" : ''}
 */

/** @type {ReturnType<typeof single<import('./types').${typeName}>>} */
const ${toCamelCase(single.singularName)}Single = single('${endpoint}');

const ${serviceName} = {
  /**
   * @param {FindOptions} [options]
   * @returns {Promise<import('./types').${typeName}|null>}
   */
  async find(options = {}) {
    try {
      const response = await ${toCamelCase(single.singularName)}Single.find({
        populate: options.populate,${localized ? '\n        locale: options.locale,' : ''}${draftAndPublish ? '\n        status: options.status,' : ''}
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  /**
   * @param {Partial<import('./types').${typeName}>} data
   * @returns {Promise<import('./types').${typeName}>}
   */
  async update(data) {
    const response = await ${toCamelCase(single.singularName)}Single.update({ data });
    return response.data;
  },

  /**
   * @returns {Promise<void>}
   */
  async delete() {
    await ${toCamelCase(single.singularName)}Single.delete();
  },
};

module.exports = { ${serviceName} };
`;
}
