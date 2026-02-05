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
import { generateZodObjectSchema, type ZodMapperOptions } from '../shared/zod-mapper.js';

export interface ByFeatureGeneratorOptions {
  outputDir: string;
  features: {
    types: boolean;
    services: boolean;
    actions: boolean;
    /**
     * Generate Zod schemas for validation
     * Useful for React Hook Form, TanStack Form, Formik, etc.
     * @default true for TypeScript, false for JSDoc
     */
    schemas?: boolean;
    /**
     * Generate upload helpers (upload-client + upload-action)
     * @default false
     */
    upload?: boolean;
  };
  /**
   * Schema generation options
   */
  schemaOptions?: {
    /**
     * Use advanced relation format with connect/disconnect/set operations
     * @default false
     */
    advancedRelations?: boolean;
  };
  blocksRendererInstalled?: boolean;
  strapiVersion?: "v4" | "v5";
  apiPrefix?: string;
  /**
   * Output format: 'typescript' for .ts files, 'jsdoc' for .js with JSDoc annotations
   * @default 'typescript'
   */
  outputFormat?: "typescript" | "jsdoc";
  /**
   * Module type for JSDoc output: 'esm' for ES Modules, 'commonjs' for CommonJS
   * @default 'commonjs'
   */
  moduleType?: "esm" | "commonjs";
}

/**
 * Generate all files using 'by-feature' structure
 *
 * Output structure:
 * strapi/
 *   collections/
 *     article/
 *       types.ts
 *       schemas.ts
 *       service.ts
 *       actions.ts
 *   singles/
 *     homepage/
 *       types.ts
 *       schemas.ts
 *       service.ts
 *   components/
 *     seo.ts
 *   shared/
 *     utils.ts
 *     client.ts
 *     upload-client.ts   (when features.upload)
 *     upload-action.ts   (when features.upload + actions + TypeScript)
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
    schemaOptions = {},
    blocksRendererInstalled = false,
    strapiVersion = "v5",
    apiPrefix = "/api",
    outputFormat = "typescript",
    moduleType = "commonjs"
  } = options;
  const generatedFiles: string[] = [];

  // Schema options
  const advancedRelations = schemaOptions.advancedRelations ?? false;

  // Determine export/import style for JSDoc
  const useESM = outputFormat === "jsdoc" && moduleType === "esm";

  // File extension based on output format
  const ext = outputFormat === "jsdoc" ? "js" : "ts";

  // Determine if schemas should be generated
  // Default: true for TypeScript, false for JSDoc (Zod works best with TS)
  const generateSchemas = features.schemas ?? (outputFormat === "typescript");

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
    ? generateUtilityTypesJSDoc(blocksRendererInstalled, strapiVersion, useESM)
    : generateUtilityTypes(blocksRendererInstalled, strapiVersion);
  await writeFile(utilsPath, await formatCode(utilsContent));
  generatedFiles.push(utilsPath);

  // Client
  const clientPath = path.join(sharedDir, `client.${ext}`);
  const clientContent = outputFormat === "jsdoc"
    ? generateClientJSDoc(strapiVersion, apiPrefix, useESM)
    : generateClient(strapiVersion, apiPrefix);
  await writeFile(clientPath, await formatCode(clientContent));
  generatedFiles.push(clientPath);

  // Locales
  const localesPath = path.join(sharedDir, `locales.${ext}`);
  const localesContent = outputFormat === "jsdoc"
    ? generateLocalesFileJSDoc(locales, useESM)
    : generateLocalesFile(locales);
  await writeFile(localesPath, await formatCode(localesContent));
  generatedFiles.push(localesPath);

  // Upload helpers
  if (features.upload) {
    // Upload client (always generated when upload is enabled)
    const uploadClientPath = path.join(sharedDir, `upload-client.${ext}`);
    const uploadClientContent = outputFormat === "jsdoc"
      ? generateUploadClientJSDoc(useESM)
      : generateUploadClientTS();
    await writeFile(uploadClientPath, await formatCode(uploadClientContent));
    generatedFiles.push(uploadClientPath);

    // Upload action (only if actions enabled + TypeScript)
    if (features.actions && outputFormat === "typescript") {
      const uploadActionPath = path.join(sharedDir, 'upload-action.ts');
      const uploadActionContent = generateUploadActionTS();
      await writeFile(uploadActionPath, await formatCode(uploadActionContent));
      generatedFiles.push(uploadActionPath);
    }
  }

  // Generate collection files
  for (const collection of schema.collections) {
    const featureDir = path.join(outputDir, 'collections', toKebabCase(collection.singularName));
    await ensureDir(featureDir);

    if (features.types) {
      const typesPath = path.join(featureDir, `types.${ext}`);
      const content = outputFormat === "jsdoc"
        ? generateCollectionTypesJSDoc(collection, schema, useESM)
        : generateCollectionTypes(collection, schema);
      await writeFile(typesPath, await formatCode(content));
      generatedFiles.push(typesPath);
    }

    // Generate schemas.ts for validation (React Hook Form, TanStack Form, etc.)
    if (generateSchemas) {
      const schemasPath = path.join(featureDir, `schemas.${ext}`);
      const schemasContent = generateCollectionSchemas(collection, schema, strapiVersion, advancedRelations);
      await writeFile(schemasPath, await formatCode(schemasContent));
      generatedFiles.push(schemasPath);
    }

    if (features.services) {
      const servicePath = path.join(featureDir, `service.${ext}`);
      const content = outputFormat === "jsdoc"
        ? generateCollectionServiceJSDoc(collection, strapiVersion, useESM)
        : generateCollectionService(collection, strapiVersion);
      await writeFile(servicePath, await formatCode(content));
      generatedFiles.push(servicePath);
    }

    if (features.actions) {
      const actionsPath = path.join(featureDir, `actions.${ext}`);
      const actionsContent = generateCollectionActions(collection, {
        strapiVersion,
        useExternalSchemas: generateSchemas,
        draftAndPublish: collection.draftAndPublish,
      });
      await writeFile(actionsPath, await formatCode(actionsContent));
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
        ? generateSingleTypesJSDoc(single, schema, useESM)
        : generateSingleTypes(single, schema);
      await writeFile(typesPath, await formatCode(content));
      generatedFiles.push(typesPath);
    }

    // Generate schemas.ts for single types too
    if (generateSchemas) {
      const schemasPath = path.join(featureDir, `schemas.${ext}`);
      const schemasContent = generateSingleSchemas(single, schema, strapiVersion, advancedRelations);
      await writeFile(schemasPath, await formatCode(schemasContent));
      generatedFiles.push(schemasPath);
    }

    if (features.services) {
      const servicePath = path.join(featureDir, `service.${ext}`);
      const content = outputFormat === "jsdoc"
        ? generateSingleServiceJSDoc(single, strapiVersion, useESM)
        : generateSingleService(single, strapiVersion);
      await writeFile(servicePath, await formatCode(content));
      generatedFiles.push(servicePath);
    }
  }

  // Generate component files
  for (const component of schema.components) {
    const componentPath = path.join(outputDir, 'components', `${toKebabCase(component.name)}.${ext}`);
    const content = outputFormat === "jsdoc"
      ? generateComponentTypesJSDoc(component, schema, useESM)
      : generateComponentTypes(component, schema, generateSchemas, strapiVersion, advancedRelations);
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

/**
 * File metadata for uploads
 * @see https://docs.strapi.io/cms/api/client#upload
 */
export interface StrapiFileInfo {
  name?: string;
  alternativeText?: string;
  caption?: string;
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

  // Note: @strapi/client is officially supported only for Strapi v5
  // For v4, we still need custom handling due to nested attributes structure
  if (isV4) {
    return `/**
 * Strapi Client (v4)
 * Generated by strapi2front
 *
 * Note: @strapi/client officially supports Strapi v5+
 * This v4 client uses a compatibility layer for the nested attributes structure
 */

import { strapi as createStrapi } from '@strapi/client';
import type { StrapiPagination, StrapiMedia, StrapiFileInfo } from './utils';

// Default configuration from environment
const defaultBaseURL = import.meta.env.STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';
const defaultAuthToken = import.meta.env.STRAPI_TOKEN || process.env.STRAPI_TOKEN;
const apiPrefix = '${normalizedPrefix}';

/**
 * Client options for authentication and connection
 * @beta This API is in beta and may change
 */
export interface ClientOptions {
  /** JWT token or API token for authentication */
  authToken?: string;
  /** Base URL of the Strapi instance (without /api prefix) */
  baseURL?: string;
}

/**
 * Create a configured Strapi client instance
 *
 * @param options - Optional configuration (authToken, baseURL)
 * @returns Configured Strapi client
 *
 * @example
 * // Default client (uses STRAPI_URL and STRAPI_TOKEN from env)
 * const client = createStrapiClient();
 *
 * @example
 * // Client with user JWT token
 * const userClient = createStrapiClient({ authToken: session.jwt });
 *
 * @beta This API is in beta and may change
 */
export function createStrapiClient(options?: ClientOptions) {
  const baseURL = (options?.baseURL || defaultBaseURL) + apiPrefix;
  const auth = options?.authToken || defaultAuthToken;

  return createStrapi({ baseURL, auth });
}

// Default client instance (uses environment variables)
export const strapiClient = createStrapiClient();

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
      if (value && typeof value === 'object' && 'data' in value) {
        const relationData = (value as { data: unknown }).data;
        if (relationData === null) {
          result[key] = null;
        } else if (Array.isArray(relationData)) {
          result[key] = relationData.map((item: StrapiV4RawItem<unknown>) =>
            flattenRelations(flattenItem(item))
          );
        } else if (typeof relationData === 'object' && 'id' in relationData && 'attributes' in relationData) {
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

/**
 * Get or create a Strapi client based on options
 * @internal
 */
function getClient(options?: ClientOptions) {
  if (options?.authToken || options?.baseURL) {
    return createStrapiClient(options);
  }
  return strapiClient;
}

/**
 * Helper to get typed collection (v4 compatibility wrapper)
 *
 * @param pluralName - The plural name of the collection (e.g., 'articles')
 * @param clientOptions - Optional client configuration
 */
export function collection<T>(pluralName: string, clientOptions?: ClientOptions) {
  const client = getClient(clientOptions);
  const col = client.collection(pluralName);
  return {
    async find(params?: Record<string, unknown>): Promise<{ data: T[]; meta: { pagination: StrapiPagination } }> {
      const response = await col.find(params) as any;
      const flattenedData = Array.isArray(response.data)
        ? response.data.map((item: StrapiV4RawItem<T>) => flattenRelations(flattenItem<T>(item)))
        : [];
      return {
        data: flattenedData,
        meta: { pagination: response.meta?.pagination || defaultPagination },
      };
    },
    async findOne(id: number | string, params?: Record<string, unknown>): Promise<{ data: T }> {
      const response = await col.findOne(String(id), params) as any;
      return { data: flattenRelations(flattenItem<T>(response.data)) };
    },
    async create(data: Partial<T>): Promise<{ data: T }> {
      const response = await col.create(data as any) as any;
      return { data: flattenRelations(flattenItem<T>(response.data)) };
    },
    async update(id: number | string, data: Partial<T>): Promise<{ data: T }> {
      const response = await col.update(String(id), data as any) as any;
      return { data: flattenRelations(flattenItem<T>(response.data)) };
    },
    async delete(id: number | string): Promise<void> {
      await col.delete(String(id));
    },
  };
}

/**
 * Helper to get typed single type (v4 compatibility wrapper)
 *
 * @param singularName - The singular name of the single type (e.g., 'homepage')
 * @param clientOptions - Optional client configuration
 */
export function single<T>(singularName: string, clientOptions?: ClientOptions) {
  const client = getClient(clientOptions);
  const singleType = client.single(singularName);
  return {
    async find(params?: Record<string, unknown>): Promise<{ data: T }> {
      const response = await singleType.find(params) as any;
      return { data: flattenRelations(flattenItem<T>(response.data)) };
    },
    async update(data: Partial<T>): Promise<{ data: T }> {
      const response = await singleType.update(data as any) as any;
      return { data: flattenRelations(flattenItem<T>(response.data)) };
    },
    async delete(): Promise<void> {
      await singleType.delete();
    },
  };
}

/**
 * File management helpers
 * Wraps @strapi/client file methods with proper typing
 * @see https://docs.strapi.io/cms/api/client#working-with-files
 */
export const files = {
  /**
   * Upload a file to Strapi
   * @see https://docs.strapi.io/cms/api/client#upload
   */
  async upload(file: File | Blob, options?: { fileInfo?: StrapiFileInfo }): Promise<StrapiMedia> {
    const response = await strapiClient.files.upload(file, options) as any;
    return response;
  },

  /**
   * Find files with optional filtering and sorting
   */
  async find(params?: Record<string, unknown>): Promise<StrapiMedia[]> {
    const response = await strapiClient.files.find(params) as any;
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get a single file by ID
   */
  async findOne(fileId: number): Promise<StrapiMedia> {
    const response = await strapiClient.files.findOne(fileId) as any;
    return response;
  },

  /**
   * Update file metadata (name, alternativeText, caption)
   */
  async update(fileId: number, fileInfo: StrapiFileInfo): Promise<StrapiMedia> {
    const response = await strapiClient.files.update(fileId, fileInfo) as any;
    return response;
  },

  /**
   * Delete a file by ID
   */
  async delete(fileId: number): Promise<StrapiMedia> {
    const response = await strapiClient.files.delete(fileId) as any;
    return response;
  },
};
`;
  }

  return `/**
 * Strapi Client (v5)
 * Generated by strapi2front
 *
 * Using official @strapi/client
 * @see https://docs.strapi.io/cms/api/client
 */

import { strapi } from '@strapi/client';
import type { StrapiPagination, StrapiMedia, StrapiFileInfo } from './utils';

// Default configuration from environment
const defaultBaseURL = import.meta.env.STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';
const defaultAuthToken = import.meta.env.STRAPI_TOKEN || process.env.STRAPI_TOKEN;
const apiPrefix = '${normalizedPrefix}';

/**
 * Client options for authentication and connection
 * @beta This API is in beta and may change
 */
export interface ClientOptions {
  /** JWT token or API token for authentication */
  authToken?: string;
  /** Base URL of the Strapi instance (without /api prefix) */
  baseURL?: string;
}

/**
 * Create a configured Strapi client instance
 *
 * @param options - Optional configuration (authToken, baseURL)
 * @returns Configured Strapi client
 *
 * @example
 * // Default client (uses STRAPI_URL and STRAPI_TOKEN from env)
 * const client = createStrapiClient();
 *
 * @example
 * // Client with user JWT token
 * const userClient = createStrapiClient({ authToken: session.jwt });
 *
 * @example
 * // Client with custom URL (multi-tenant)
 * const tenantClient = createStrapiClient({
 *   baseURL: 'https://tenant.example.com',
 *   authToken: tenantToken
 * });
 *
 * @beta This API is in beta and may change
 */
export function createStrapiClient(options?: ClientOptions) {
  const baseURL = (options?.baseURL || defaultBaseURL) + apiPrefix;
  const auth = options?.authToken || defaultAuthToken;

  return strapi({ baseURL, auth });
}

// Default client instance (uses environment variables)
export const strapiClient = createStrapiClient();

// Default pagination for fallback
const defaultPagination: StrapiPagination = {
  page: 1,
  pageSize: 25,
  pageCount: 1,
  total: 0,
};

/**
 * Get or create a Strapi client based on options
 * @internal
 */
function getClient(options?: ClientOptions) {
  if (options?.authToken || options?.baseURL) {
    return createStrapiClient(options);
  }
  return strapiClient;
}

/**
 * Helper to get typed collection
 * Wraps @strapi/client collection methods with proper typing
 *
 * @param pluralName - The plural name of the collection (e.g., 'articles')
 * @param clientOptions - Optional client configuration
 */
export function collection<T>(pluralName: string, clientOptions?: ClientOptions) {
  const client = getClient(clientOptions);
  const col = client.collection(pluralName);
  return {
    async find(params?: Record<string, unknown>): Promise<{ data: T[]; meta: { pagination: StrapiPagination } }> {
      const response = await col.find(params) as any;
      return {
        data: Array.isArray(response.data) ? response.data : [],
        meta: { pagination: response.meta?.pagination || defaultPagination },
      };
    },
    async findOne(documentId: string, params?: Record<string, unknown>): Promise<{ data: T }> {
      const response = await col.findOne(documentId, params) as any;
      return { data: response.data };
    },
    async create(data: Partial<T>): Promise<{ data: T }> {
      const response = await col.create(data as any) as any;
      return { data: response.data };
    },
    async update(documentId: string, data: Partial<T>): Promise<{ data: T }> {
      const response = await col.update(documentId, data as any) as any;
      return { data: response.data };
    },
    async delete(documentId: string): Promise<void> {
      await col.delete(documentId);
    },
  };
}

/**
 * Helper to get typed single type
 * Wraps @strapi/client single methods with proper typing
 *
 * @param singularName - The singular name of the single type (e.g., 'homepage')
 * @param clientOptions - Optional client configuration
 */
export function single<T>(singularName: string, clientOptions?: ClientOptions) {
  const client = getClient(clientOptions);
  const singleType = client.single(singularName);
  return {
    async find(params?: Record<string, unknown>): Promise<{ data: T }> {
      const response = await singleType.find(params) as any;
      return { data: response.data };
    },
    async update(data: Partial<T>): Promise<{ data: T }> {
      const response = await singleType.update(data as any) as any;
      return { data: response.data };
    },
    async delete(): Promise<void> {
      await singleType.delete();
    },
  };
}

/**
 * File management helpers
 * Wraps @strapi/client file methods with proper typing
 * @see https://docs.strapi.io/cms/api/client#working-with-files
 */
export const files = {
  /**
   * Upload a file to Strapi
   *
   * @example
   * // Browser: upload from file input
   * const file = fileInput.files[0];
   * const uploaded = await files.upload(file, {
   *   fileInfo: { alternativeText: 'My image', caption: 'A caption' }
   * });
   *
   * @example
   * // Use the returned ID to link to an entry
   * await collection('articles').create({
   *   title: 'My article',
   *   cover: uploaded.id,
   * });
   *
   * @see https://docs.strapi.io/cms/api/client#upload
   */
  async upload(file: File | Blob, options?: { fileInfo?: StrapiFileInfo }): Promise<StrapiMedia> {
    const response = await strapiClient.files.upload(file, options) as any;
    return response;
  },

  /**
   * Find files with optional filtering and sorting
   *
   * @example
   * const images = await files.find({
   *   filters: { mime: { $contains: 'image' } },
   *   sort: ['name:asc'],
   * });
   */
  async find(params?: Record<string, unknown>): Promise<StrapiMedia[]> {
    const response = await strapiClient.files.find(params) as any;
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get a single file by ID
   */
  async findOne(fileId: number): Promise<StrapiMedia> {
    const response = await strapiClient.files.findOne(fileId) as any;
    return response;
  },

  /**
   * Update file metadata (name, alternativeText, caption)
   */
  async update(fileId: number, fileInfo: StrapiFileInfo): Promise<StrapiMedia> {
    const response = await strapiClient.files.update(fileId, fileInfo) as any;
    return response;
  },

  /**
   * Delete a file by ID
   */
  async delete(fileId: number): Promise<StrapiMedia> {
    const response = await strapiClient.files.delete(fileId) as any;
    return response;
  },
};
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

function generateComponentTypes(
  component: ComponentType,
  schema: ParsedSchema,
  includeSchemas: boolean = false,
  strapiVersion: "v4" | "v5" = "v5",
  advancedRelations: boolean = false
): string {
  const typeName = toPascalCase(component.name);
  const schemaName = toCamelCase(component.name);
  const attributes = generateAttributes(component.attributes);
  const imports = generateTypeImports(component.attributes, schema, 'component');

  let content = `/**
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

  // Add Zod schema if enabled
  if (includeSchemas) {
    const componentSchemaNames = buildComponentSchemaNames(component.attributes, schema);
    const schemaImports = generateSchemaImports(component.attributes, schema, 'component');
    const schemaOptions: ZodMapperOptions = {
      isUpdate: false,
      strapiVersion,
      useAdvancedRelations: advancedRelations,
      componentSchemaNames,
    };
    const schemaResult = generateZodObjectSchema(component.attributes, schemaOptions);

    content += `
import { z } from 'zod';
${schemaImports}
/**
 * Zod schema for ${component.displayName} component
 * Use this for validating component data in forms
 */
export const ${schemaName}Schema = ${schemaResult.schema};

/**
 * Inferred type from schema
 */
export type ${typeName}Input = z.infer<typeof ${schemaName}Schema>;
`;
  }

  return content;
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
    `import { collection, type ClientOptions } from '../../shared/client';`,
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

  // Create options interface (only for draftAndPublish collections)
  const createOptionsInterface = draftAndPublish ? `
export interface CreateOptions {
  /** Publish immediately or create as draft. Default: 'draft' */
  status?: 'draft' | 'published';
}
` : '';

  // Update options interface (only for draftAndPublish collections)
  const updateOptionsInterface = draftAndPublish ? `
export interface UpdateOptions {
  /** Change publication status */
  status?: 'draft' | 'published';
}
` : '';

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
${createOptionsInterface}${updateOptionsInterface}
/**
 * Get a typed collection helper, optionally with custom client options
 * @internal
 */
function getCollection(clientOptions?: ClientOptions) {
  return collection<${typeName}>('${endpoint}', clientOptions);
}

export const ${serviceName} = {
  /**
   * Find multiple ${collection.displayName} entries
   * @param options - Query options (filters, pagination, sort, populate)
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async findMany(options: FindManyOptions = {}, clientOptions?: ClientOptions): Promise<{ data: ${typeName}[]; pagination: StrapiPagination }> {
    const col = getCollection(clientOptions);
    const response = await col.find({
${findParams}
    });

    return {
      data: response.data,
      pagination: response.meta.pagination,
    };
  },

  /**
   * Find all ${collection.displayName} entries (handles pagination automatically)
   * @param options - Query options (filters, sort, populate)
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async findAll(options: Omit<FindManyOptions, 'pagination'> = {}, clientOptions?: ClientOptions): Promise<${typeName}[]> {
    const allItems: ${typeName}[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data, pagination } = await this.findMany({
        ...options,
        pagination: { page, pageSize: 100 },
      }, clientOptions);

      allItems.push(...data);
      hasMore = page < pagination.pageCount;
      page++;
    }

    return allItems;
  },

  /**
   * Find a single ${collection.displayName} by ID
   * @param ${idName} - The ${isV4 ? 'numeric ID' : 'document ID'}
   * @param options - Query options (populate)
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async findOne(${idParam}, options: FindOneOptions = {}, clientOptions?: ClientOptions): Promise<${typeName} | null> {
    try {
      const col = getCollection(clientOptions);
      const response = await col.findOne(${idName}, {
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
  /**
   * Find a single ${collection.displayName} by slug
   * @param slug - The slug value
   * @param options - Query options (populate)
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async findBySlug(slug: string, options: FindOneOptions = {}, clientOptions?: ClientOptions): Promise<${typeName} | null> {
    const { data } = await this.findMany({
      filters: { slug: { $eq: slug } } as ${typeName}Filters,
      pagination: { pageSize: 1 },
      populate: options.populate,${localized ? '\n      locale: options.locale,' : ''}${draftAndPublish ? '\n      status: options.status,' : ''}
    }, clientOptions);

    return data[0] || null;
  },
` : ''}
  /**
   * Create a new ${collection.displayName}
   * @param data - The data to create
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async create(data: Partial<Omit<${typeName}, ${omitFields}>>${draftAndPublish ? ', options: CreateOptions = {}' : ''}, clientOptions?: ClientOptions): Promise<${typeName}> {
    const col = getCollection(clientOptions);
    const response = await col.create(${draftAndPublish ? '{ ...data, status: options.status }' : 'data'});
    return response.data;
  },

  /**
   * Update an existing ${collection.displayName}
   * @param ${idName} - The ${isV4 ? 'numeric ID' : 'document ID'}
   * @param data - The data to update
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async update(${idParam}, data: Partial<Omit<${typeName}, ${omitFieldsUpdate}>>${draftAndPublish ? ', options: UpdateOptions = {}' : ''}, clientOptions?: ClientOptions): Promise<${typeName}> {
    const col = getCollection(clientOptions);
    const response = await col.update(${idName}, ${draftAndPublish ? '{ ...data, status: options.status }' : 'data'});
    return response.data;
  },

  /**
   * Delete a ${collection.displayName}
   * @param ${idName} - The ${isV4 ? 'numeric ID' : 'document ID'}
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async delete(${idParam}, clientOptions?: ClientOptions): Promise<void> {
    const col = getCollection(clientOptions);
    await col.delete(${idName});
  },

  /**
   * Count ${collection.displayName} entries
   * @param filters - Optional filters
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async count(filters?: ${typeName}Filters, clientOptions?: ClientOptions): Promise<number> {
    const { pagination } = await this.findMany({
      filters,
      pagination: { pageSize: 1 },
    }, clientOptions);

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
    `import { single, type ClientOptions } from '../../shared/client';`,
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

/**
 * Get a typed single helper, optionally with custom client options
 * @internal
 */
function getSingle(clientOptions?: ClientOptions) {
  return single<${typeName}>('${endpoint}', clientOptions);
}

export const ${serviceName} = {
  /**
   * Find the ${single.displayName} single type
   * @param options - Query options (populate)
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async find(options: FindOptions = {}, clientOptions?: ClientOptions): Promise<${typeName} | null> {
    try {
      const s = getSingle(clientOptions);
      const response = await s.find({
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

  /**
   * Update the ${single.displayName} single type
   * @param data - The data to update
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async update(data: Partial<Omit<${typeName}, ${omitFields}>>, clientOptions?: ClientOptions): Promise<${typeName}> {
    const s = getSingle(clientOptions);
    const response = await s.update(data);
    return response.data;
  },

  /**
   * Delete the ${single.displayName} single type
   * @param clientOptions - Optional client configuration (authToken, baseURL) - beta
   */
  async delete(clientOptions?: ClientOptions): Promise<void> {
    const s = getSingle(clientOptions);
    await s.delete();
  },
};
`;
}

// ============================================
// Zod Schemas Generation (Reusable)
// ============================================

/**
 * Build a Map of component UIDs → schema variable names
 * by scanning attributes for component and dynamiczone types.
 */
function buildComponentSchemaNames(
  attributes: Record<string, Attribute>,
  schema: ParsedSchema
): Map<string, string> {
  const map = new Map<string, string>();

  for (const attr of Object.values(attributes)) {
    if (attr.type === 'component' && 'component' in attr && attr.component) {
      const uid = attr.component;
      if (!map.has(uid)) {
        const componentName = uid.split('.').pop() || '';
        // Verify component exists in schema
        const exists = schema.components.some((c) => c.name === componentName);
        if (exists && componentName) {
          map.set(uid, `${toCamelCase(componentName)}Schema`);
        }
      }
    }

    if (attr.type === 'dynamiczone' && 'components' in attr && attr.components) {
      for (const uid of attr.components) {
        if (!map.has(uid)) {
          const componentName = uid.split('.').pop() || '';
          const exists = schema.components.some((c) => c.name === componentName);
          if (exists && componentName) {
            map.set(uid, `${toCamelCase(componentName)}Schema`);
          }
        }
      }
    }
  }

  return map;
}

/**
 * Generate import statements for component schemas referenced in attributes.
 * Returns a string with import lines (including trailing newline) or empty string.
 */
function generateSchemaImports(
  attributes: Record<string, Attribute>,
  schema: ParsedSchema,
  context: 'collection' | 'single' | 'component'
): string {
  const imports = new Map<string, string>(); // schemaVarName → import path

  const relativePrefix = context === 'component' ? '.' : '../../components';

  for (const attr of Object.values(attributes)) {
    if (attr.type === 'component' && 'component' in attr && attr.component) {
      addComponentImport(attr.component, imports, schema, relativePrefix);
    }

    if (attr.type === 'dynamiczone' && 'components' in attr && attr.components) {
      for (const uid of attr.components) {
        addComponentImport(uid, imports, schema, relativePrefix);
      }
    }
  }

  if (imports.size === 0) return '';

  const lines: string[] = [];
  for (const [schemaVarName, importPath] of imports) {
    lines.push(`import { ${schemaVarName} } from '${importPath}';`);
  }
  return lines.join('\n') + '\n';
}

function addComponentImport(
  uid: string,
  imports: Map<string, string>,
  schema: ParsedSchema,
  relativePrefix: string
): void {
  const componentName = uid.split('.').pop() || '';
  if (!componentName) return;

  const exists = schema.components.some((c) => c.name === componentName);
  if (!exists) return;

  const schemaVarName = `${toCamelCase(componentName)}Schema`;
  if (imports.has(schemaVarName)) return;

  const fileName = toKebabCase(componentName);
  imports.set(schemaVarName, `${relativePrefix}/${fileName}`);
}

/**
 * Generate Zod schemas for a collection type
 * These schemas can be reused with React Hook Form, TanStack Form, etc.
 */
function generateCollectionSchemas(
  collection: CollectionType,
  schema: ParsedSchema,
  strapiVersion: "v4" | "v5" = "v5",
  advancedRelations: boolean = false
): string {
  const name = toCamelCase(collection.singularName);
  const pascalName = toPascalCase(collection.singularName);

  const componentSchemaNames = buildComponentSchemaNames(collection.attributes, schema);
  const schemaImports = generateSchemaImports(collection.attributes, schema, 'collection');

  const schemaOptions: ZodMapperOptions = {
    isUpdate: false,
    strapiVersion,
    useAdvancedRelations: advancedRelations,
    componentSchemaNames,
  };
  const createResult = generateZodObjectSchema(collection.attributes, schemaOptions);
  const updateResult = generateZodObjectSchema(collection.attributes, { ...schemaOptions, isUpdate: true });

  return `/**
 * ${collection.displayName} Zod Schemas
 * ${collection.description || ''}
 * Generated by strapi2front
 *
 * These schemas can be used for:
 * - Form validation (React Hook Form, TanStack Form, Formik, etc.)
 * - API request/response validation
 * - Type inference
 */

import { z } from 'zod';
${schemaImports}
/**
 * Schema for creating a new ${collection.displayName}
 */
export const ${name}CreateSchema = ${createResult.schema};

/**
 * Schema for updating a ${collection.displayName}
 * All fields are optional for partial updates
 */
export const ${name}UpdateSchema = ${updateResult.schema};

/**
 * Inferred types from schemas
 * Use these for type-safe form handling
 */
export type ${pascalName}CreateInput = z.infer<typeof ${name}CreateSchema>;
export type ${pascalName}UpdateInput = z.infer<typeof ${name}UpdateSchema>;
`;
}

/**
 * Generate Zod schemas for a single type
 */
function generateSingleSchemas(
  single: SingleType,
  schema: ParsedSchema,
  strapiVersion: "v4" | "v5" = "v5",
  advancedRelations: boolean = false
): string {
  const name = toCamelCase(single.singularName);
  const pascalName = toPascalCase(single.singularName);

  const componentSchemaNames = buildComponentSchemaNames(single.attributes, schema);
  const schemaImports = generateSchemaImports(single.attributes, schema, 'single');

  const updateResult = generateZodObjectSchema(single.attributes, {
    isUpdate: true,
    strapiVersion,
    useAdvancedRelations: advancedRelations,
    componentSchemaNames,
  });

  return `/**
 * ${single.displayName} Zod Schemas (Single Type)
 * ${single.description || ''}
 * Generated by strapi2front
 *
 * These schemas can be used for:
 * - Form validation (React Hook Form, TanStack Form, Formik, etc.)
 * - API request/response validation
 * - Type inference
 */

import { z } from 'zod';
${schemaImports}
/**
 * Schema for updating ${single.displayName}
 * All fields are optional for partial updates
 */
export const ${name}UpdateSchema = ${updateResult.schema};

/**
 * Inferred type from schema
 */
export type ${pascalName}UpdateInput = z.infer<typeof ${name}UpdateSchema>;
`;
}

// ============================================
// Collection Actions Generation
// ============================================

interface ActionsGeneratorOptions {
  strapiVersion: "v4" | "v5";
  /** Whether schemas are generated separately (import from ./schemas) */
  useExternalSchemas: boolean;
  /** Whether the collection has draftAndPublish enabled */
  draftAndPublish?: boolean;
}

function generateCollectionActions(collection: CollectionType, options: ActionsGeneratorOptions): string {
  const { strapiVersion, useExternalSchemas, draftAndPublish = false } = options;
  const typeName = toPascalCase(collection.singularName);
  const serviceName = toCamelCase(collection.singularName) + 'Service';
  const actionPrefix = toCamelCase(collection.singularName);
  const isV4 = strapiVersion === "v4";

  // V4 uses `id: number`, V5 uses `documentId: string`
  const idInputSchema = isV4 ? 'z.number().int().positive()' : 'z.string()';
  const idParamName = isV4 ? 'id' : 'documentId';

  // Status schema for draft and publish (only v5 has proper support)
  const statusSchema = "z.enum(['draft', 'published']).optional()";

  // Schema imports or inline fallback
  const schemaImport = useExternalSchemas
    ? `import { ${actionPrefix}CreateSchema, ${actionPrefix}UpdateSchema } from './schemas';`
    : '';

  const createSchema = useExternalSchemas
    ? `${actionPrefix}CreateSchema`
    : 'z.record(z.unknown())';

  const updateSchema = useExternalSchemas
    ? `${actionPrefix}UpdateSchema`
    : 'z.record(z.unknown())';

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
${schemaImport}

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
      data: ${createSchema},${draftAndPublish ? `\n      status: ${statusSchema},` : ''}
    }),
    handler: async (input) => {
      const data = await ${serviceName}.create(input.data as Partial<${typeName}>${draftAndPublish ? ', { status: input.status }' : ''});
      return { data };
    },
  }),

  update: defineAction({
    input: z.object({
      ${idParamName}: ${idInputSchema},
      data: ${updateSchema},${draftAndPublish ? `\n      status: ${statusSchema},` : ''}
    }),
    handler: async (input) => {
      const data = await ${serviceName}.update(input.${idParamName}, input.data as Partial<${typeName}>${draftAndPublish ? ', { status: input.status }' : ''});
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

function generateUtilityTypesJSDoc(blocksRendererInstalled: boolean, strapiVersion: "v4" | "v5", useESM: boolean = false): string {
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

${useESM ? 'export { flattenV4Response, flattenV4ListResponse };' : 'module.exports = { flattenV4Response, flattenV4ListResponse };'}` : '';

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
 * File metadata for uploads
 * @see https://docs.strapi.io/cms/api/client#upload
 * @typedef {Object} StrapiFileInfo
 * @property {string} [name]
 * @property {string} [alternativeText]
 * @property {string} [caption]
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

${useESM ? 'export {};' : 'module.exports = {};'}
`;
}

function generateClientJSDoc(strapiVersion: "v4" | "v5", apiPrefix: string = "/api", useESM: boolean = false): string {
  const isV4 = strapiVersion === "v4";
  const normalizedPrefix = apiPrefix.startsWith('/') ? apiPrefix : '/' + apiPrefix;

  const importStatement = useESM
    ? `import { strapi as createStrapi } from '@strapi/client';`
    : `const { strapi: createStrapi } = require('@strapi/client');`;

  if (isV4) {
    return `// @ts-check
/**
 * Strapi Client (v4)
 * Generated by strapi2front
 *
 * Note: @strapi/client officially supports Strapi v5+
 * This v4 client uses a compatibility layer for the nested attributes structure
 */

${importStatement}

// Initialize the Strapi client
const baseURL = (process.env.STRAPI_URL || 'http://localhost:1337') + '${normalizedPrefix}';
const authToken = process.env.STRAPI_TOKEN;

const strapiClient = createStrapi({
  baseURL,
  auth: authToken,
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
 * Helper to get typed collection (v4 compatibility wrapper)
 * @template T
 * @param {string} pluralName
 */
function collection(pluralName) {
  const col = strapiClient.collection(pluralName);
  return {
    /**
     * @param {Record<string, unknown>} [params]
     * @returns {Promise<{ data: T[], meta: { pagination: import('./utils').StrapiPagination } }>}
     */
    async find(params) {
      const response = await col.find(params);
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
      const response = await col.findOne(String(id), params);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const data = flattenRelations(flattenItem(rawData));
      return { data };
    },
    /**
     * @param {Partial<T>} data
     * @returns {Promise<{ data: T }>}
     */
    async create(data) {
      const response = await col.create(data);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const result = flattenRelations(flattenItem(rawData));
      return { data: result };
    },
    /**
     * @param {number|string} id
     * @param {Partial<T>} data
     * @returns {Promise<{ data: T }>}
     */
    async update(id, data) {
      const response = await col.update(String(id), data);
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
      await col.delete(String(id));
    },
  };
}

/**
 * Helper to get typed single type (v4 compatibility wrapper)
 * @template T
 * @param {string} singularName
 */
function single(singularName) {
  const singleType = strapiClient.single(singularName);
  return {
    /**
     * @param {Record<string, unknown>} [params]
     * @returns {Promise<{ data: T }>}
     */
    async find(params) {
      const response = await singleType.find(params);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const data = flattenRelations(flattenItem(rawData));
      return { data };
    },
    /**
     * @param {Partial<T>} data
     * @returns {Promise<{ data: T }>}
     */
    async update(data) {
      const response = await singleType.update(data);
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
      await singleType.delete();
    },
  };
}

/**
 * File management helpers
 * Wraps @strapi/client file methods with proper typing
 * @see https://docs.strapi.io/cms/api/client#working-with-files
 */
const files = {
  /**
   * Upload a file to Strapi
   * @param {File|Blob} file
   * @param {{ fileInfo?: import('./utils').StrapiFileInfo }} [options]
   * @returns {Promise<import('./utils').StrapiMedia>}
   * @see https://docs.strapi.io/cms/api/client#upload
   */
  async upload(file, options) {
    /** @type {any} */
    const response = await strapiClient.files.upload(file, options);
    return response;
  },

  /**
   * Find files with optional filtering and sorting
   * @param {Record<string, unknown>} [params]
   * @returns {Promise<import('./utils').StrapiMedia[]>}
   */
  async find(params) {
    /** @type {any} */
    const response = await strapiClient.files.find(params);
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get a single file by ID
   * @param {number} fileId
   * @returns {Promise<import('./utils').StrapiMedia>}
   */
  async findOne(fileId) {
    /** @type {any} */
    const response = await strapiClient.files.findOne(fileId);
    return response;
  },

  /**
   * Update file metadata (name, alternativeText, caption)
   * @param {number} fileId
   * @param {import('./utils').StrapiFileInfo} fileInfo
   * @returns {Promise<import('./utils').StrapiMedia>}
   */
  async update(fileId, fileInfo) {
    /** @type {any} */
    const response = await strapiClient.files.update(fileId, fileInfo);
    return response;
  },

  /**
   * Delete a file by ID
   * @param {number} fileId
   * @returns {Promise<import('./utils').StrapiMedia>}
   */
  async delete(fileId) {
    /** @type {any} */
    const response = await strapiClient.files.delete(fileId);
    return response;
  },
};

${useESM ? 'export { strapiClient, collection, single, files };' : 'module.exports = { strapiClient, collection, single, files };'}
`;
  }

  return `// @ts-check
/**
 * Strapi Client (v5)
 * Generated by strapi2front
 *
 * Using official @strapi/client
 * @see https://docs.strapi.io/cms/api/client
 */

${importStatement}

// Initialize the Strapi client
const baseURL = (process.env.STRAPI_URL || 'http://localhost:1337') + '${normalizedPrefix}';
const authToken = process.env.STRAPI_TOKEN;

const strapiClient = createStrapi({
  baseURL,
  auth: authToken,
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
  const col = strapiClient.collection(pluralName);
  return {
    /**
     * @param {Record<string, unknown>} [params]
     * @returns {Promise<{ data: T[], meta: { pagination: import('./utils').StrapiPagination } }>}
     */
    async find(params) {
      const response = await col.find(params);
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
      const response = await col.findOne(documentId, params);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const data = rawData;
      return { data };
    },
    /**
     * @param {Partial<T>} data
     * @returns {Promise<{ data: T }>}
     */
    async create(data) {
      const response = await col.create(data);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const result = rawData;
      return { data: result };
    },
    /**
     * @param {string} documentId
     * @param {Partial<T>} data
     * @returns {Promise<{ data: T }>}
     */
    async update(documentId, data) {
      const response = await col.update(documentId, data);
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
      await col.delete(documentId);
    },
  };
}

/**
 * Helper to get typed single type
 * @template T
 * @param {string} singularName
 */
function single(singularName) {
  const singleType = strapiClient.single(singularName);
  return {
    /**
     * @param {Record<string, unknown>} [params]
     * @returns {Promise<{ data: T }>}
     */
    async find(params) {
      const response = await singleType.find(params);
      /** @type {any} */
      const rawData = response.data;
      /** @type {T} */
      const data = rawData;
      return { data };
    },
    /**
     * @param {Partial<T>} data
     * @returns {Promise<{ data: T }>}
     */
    async update(data) {
      const response = await singleType.update(data);
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
      await singleType.delete();
    },
  };
}

/**
 * File management helpers
 * Wraps @strapi/client file methods with proper typing
 * @see https://docs.strapi.io/cms/api/client#working-with-files
 */
const files = {
  /**
   * Upload a file to Strapi
   * @param {File|Blob} file
   * @param {{ fileInfo?: import('./utils').StrapiFileInfo }} [options]
   * @returns {Promise<import('./utils').StrapiMedia>}
   * @see https://docs.strapi.io/cms/api/client#upload
   */
  async upload(file, options) {
    /** @type {any} */
    const response = await strapiClient.files.upload(file, options);
    return response;
  },

  /**
   * Find files with optional filtering and sorting
   * @param {Record<string, unknown>} [params]
   * @returns {Promise<import('./utils').StrapiMedia[]>}
   */
  async find(params) {
    /** @type {any} */
    const response = await strapiClient.files.find(params);
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get a single file by ID
   * @param {number} fileId
   * @returns {Promise<import('./utils').StrapiMedia>}
   */
  async findOne(fileId) {
    /** @type {any} */
    const response = await strapiClient.files.findOne(fileId);
    return response;
  },

  /**
   * Update file metadata (name, alternativeText, caption)
   * @param {number} fileId
   * @param {import('./utils').StrapiFileInfo} fileInfo
   * @returns {Promise<import('./utils').StrapiMedia>}
   */
  async update(fileId, fileInfo) {
    /** @type {any} */
    const response = await strapiClient.files.update(fileId, fileInfo);
    return response;
  },

  /**
   * Delete a file by ID
   * @param {number} fileId
   * @returns {Promise<import('./utils').StrapiMedia>}
   */
  async delete(fileId) {
    /** @type {any} */
    const response = await strapiClient.files.delete(fileId);
    return response;
  },
};

${useESM ? 'export { strapiClient, collection, single, files };' : 'module.exports = { strapiClient, collection, single, files };'}
`;
}

function generateLocalesFileJSDoc(locales: StrapiLocale[], useESM: boolean = false): string {
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

${useESM ? 'export { locales, defaultLocale, localeNames, isValidLocale, getLocaleName };' : 'module.exports = { locales, defaultLocale, localeNames, isValidLocale, getLocaleName };'}
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

${useESM ? 'export { locales, defaultLocale, localeNames, isValidLocale, getLocaleName };' : 'module.exports = { locales, defaultLocale, localeNames, isValidLocale, getLocaleName };'}
`;
}

// ============================================
// JSDoc Collection Types Generation
// ============================================

function generateCollectionTypesJSDoc(collection: CollectionType, schema: ParsedSchema, useESM: boolean = false): string {
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

${useESM ? 'export {};' : 'module.exports = {};'}
`;
}

function generateSingleTypesJSDoc(single: SingleType, schema: ParsedSchema, useESM: boolean = false): string {
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

${useESM ? 'export {};' : 'module.exports = {};'}
`;
}

function generateComponentTypesJSDoc(component: ComponentType, schema: ParsedSchema, useESM: boolean = false): string {
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

${useESM ? 'export {};' : 'module.exports = {};'}
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

function generateCollectionServiceJSDoc(collection: CollectionType, strapiVersion: "v4" | "v5", useESM: boolean = false): string {
  const typeName = toPascalCase(collection.singularName);
  const serviceName = toCamelCase(collection.singularName) + 'Service';
  const endpoint = collection.pluralName;
  const hasSlug = 'slug' in collection.attributes;
  const { localized, draftAndPublish } = collection;
  const isV4 = strapiVersion === "v4";

  // V4 uses `id: number`, V5 uses `documentId: string`
  const idParam = isV4 ? 'id' : 'documentId';
  const idType = isV4 ? 'number' : 'string';

  const importStatement = useESM
    ? `import { collection } from '../../shared/client.js';`
    : `const { collection } = require('../../shared/client');`;

  return `// @ts-check
/**
 * ${collection.displayName} Service
 * ${collection.description || ''}
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

${importStatement}

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
    const response = await ${toCamelCase(collection.singularName)}Collection.create(data);
    return response.data;
  },

  /**
   * @param {${idType}} ${idParam}
   * @param {Partial<import('./types').${typeName}>} data
   * @returns {Promise<import('./types').${typeName}>}
   */
  async update(${idParam}, data) {
    const response = await ${toCamelCase(collection.singularName)}Collection.update(${idParam}, data);
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

${useESM ? `export { ${serviceName} };` : `module.exports = { ${serviceName} };`}
`;
}

// ============================================
// JSDoc Single Service Generation
// ============================================

function generateSingleServiceJSDoc(single: SingleType, strapiVersion: "v4" | "v5", useESM: boolean = false): string {
  const typeName = toPascalCase(single.singularName);
  const serviceName = toCamelCase(single.singularName) + 'Service';
  const endpoint = single.singularName;
  const { localized, draftAndPublish } = single;

  const importStatement = useESM
    ? `import { single } from '../../shared/client.js';`
    : `const { single } = require('../../shared/client');`;

  return `// @ts-check
/**
 * ${single.displayName} Service (Single Type)
 * ${single.description || ''}
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

${importStatement}

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
    const response = await ${toCamelCase(single.singularName)}Single.update(data);
    return response.data;
  },

  /**
   * @returns {Promise<void>}
   */
  async delete() {
    await ${toCamelCase(single.singularName)}Single.delete();
  },
};

${useESM ? `export { ${serviceName} };` : `module.exports = { ${serviceName} };`}
`;
}

// ============================================
// Upload Helpers Generation
// ============================================

function generateUploadClientTS(): string {
  return `/**
 * Public Upload Client
 * Generated by strapi2front
 *
 * Uploads files directly from the browser to Strapi using a restricted public token.
 * This token should ONLY have upload permissions (no delete, no update).
 *
 * Required environment variables:
 *   PUBLIC_STRAPI_URL - Your Strapi CMS base URL
 *   PUBLIC_STRAPI_UPLOAD_TOKEN - Restricted API token (upload-only)
 *
 * Create the token in: Strapi Admin > Settings > API Tokens
 * Set permissions: Upload > upload (only)
 */

import type { StrapiMedia, StrapiFileInfo } from './utils';

const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL || '';
const UPLOAD_TOKEN = import.meta.env.PUBLIC_STRAPI_UPLOAD_TOKEN || '';

/**
 * Upload a single file to Strapi from the browser
 */
export async function uploadFile(
  file: File,
  fileInfo?: StrapiFileInfo
): Promise<StrapiMedia> {
  const formData = new FormData();
  formData.append('files', file);

  if (fileInfo) {
    formData.append('fileInfo', JSON.stringify(fileInfo));
  }

  const response = await fetch(\`\${STRAPI_URL}/api/upload\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${UPLOAD_TOKEN}\`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(\`Upload failed: \${response.status} \${response.statusText}\`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Upload multiple files to Strapi from the browser
 */
export async function uploadFiles(
  files: File[],
  fileInfo?: StrapiFileInfo
): Promise<StrapiMedia[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  if (fileInfo) {
    formData.append('fileInfo', JSON.stringify(fileInfo));
  }

  const response = await fetch(\`\${STRAPI_URL}/api/upload\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${UPLOAD_TOKEN}\`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(\`Upload failed: \${response.status} \${response.statusText}\`);
  }

  return response.json();
}
`;
}

function generateUploadClientJSDoc(useESM: boolean): string {
  return `/**
 * Public Upload Client
 * Generated by strapi2front
 *
 * Uploads files directly from the browser to Strapi using a restricted public token.
 * This token should ONLY have upload permissions (no delete, no update).
 *
 * Required environment variables:
 *   PUBLIC_STRAPI_URL - Your Strapi CMS base URL
 *   PUBLIC_STRAPI_UPLOAD_TOKEN - Restricted API token (upload-only)
 *
 * Create the token in: Strapi Admin > Settings > API Tokens
 * Set permissions: Upload > upload (only)
 */

/** @typedef {import('./utils').StrapiMedia} StrapiMedia */
/** @typedef {import('./utils').StrapiFileInfo} StrapiFileInfo */

const STRAPI_URL = ${useESM ? "import.meta.env.PUBLIC_STRAPI_URL || ''" : "process.env.PUBLIC_STRAPI_URL || ''"};
const UPLOAD_TOKEN = ${useESM ? "import.meta.env.PUBLIC_STRAPI_UPLOAD_TOKEN || ''" : "process.env.PUBLIC_STRAPI_UPLOAD_TOKEN || ''"};

/**
 * Upload a single file to Strapi from the browser
 * @param {File} file - The file to upload
 * @param {StrapiFileInfo} [fileInfo] - Optional file metadata
 * @returns {Promise<StrapiMedia>}
 */
${useESM ? "export " : ""}async function uploadFile(file, fileInfo) {
  const formData = new FormData();
  formData.append('files', file);

  if (fileInfo) {
    formData.append('fileInfo', JSON.stringify(fileInfo));
  }

  const response = await fetch(\`\${STRAPI_URL}/api/upload\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${UPLOAD_TOKEN}\`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(\`Upload failed: \${response.status} \${response.statusText}\`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Upload multiple files to Strapi from the browser
 * @param {File[]} files - The files to upload
 * @param {StrapiFileInfo} [fileInfo] - Optional file metadata (applied to all)
 * @returns {Promise<StrapiMedia[]>}
 */
${useESM ? "export " : ""}async function uploadFiles(files, fileInfo) {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  if (fileInfo) {
    formData.append('fileInfo', JSON.stringify(fileInfo));
  }

  const response = await fetch(\`\${STRAPI_URL}/api/upload\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${UPLOAD_TOKEN}\`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(\`Upload failed: \${response.status} \${response.statusText}\`);
  }

  return response.json();
}

${useESM ? "" : "module.exports = { uploadFile, uploadFiles };"}
`;
}

function generateUploadActionTS(): string {
  return `/**
 * Upload Action
 * Generated by strapi2front
 *
 * Astro Action that receives files via FormData and uploads them to Strapi server-side.
 * Uses the private STRAPI_TOKEN — never exposed to the browser.
 *
 * Usage:
 *   import { actions } from 'astro:actions';
 *   const result = await actions.upload({ file: myFile, alternativeText: 'My image' });
 *
 * Register this action in src/actions/index.ts:
 *   import { uploadAction, uploadMultipleAction } from '../strapi/shared/upload-action';
 *   export const server = { upload: uploadAction, uploadMultiple: uploadMultipleAction };
 */

import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { files } from './client';

/**
 * Upload a single file via Astro Action (server-side, secure)
 */
export const uploadAction = defineAction({
  accept: 'form',
  input: z.object({
    file: z.instanceof(File),
    name: z.string().optional(),
    alternativeText: z.string().optional(),
    caption: z.string().optional(),
  }),
  handler: async (input) => {
    try {
      const { file, name, alternativeText, caption } = input;

      const fileInfo: Record<string, string> = {};
      if (name) fileInfo.name = name;
      if (alternativeText) fileInfo.alternativeText = alternativeText;
      if (caption) fileInfo.caption = caption;

      const result = await files.upload(file, {
        fileInfo: Object.keys(fileInfo).length > 0 ? fileInfo : undefined,
      });

      return result;
    } catch (error) {
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  },
});

/**
 * Upload multiple files via Astro Action (server-side, secure)
 */
export const uploadMultipleAction = defineAction({
  accept: 'form',
  input: z.object({
    files: z.array(z.instanceof(File)).min(1),
    alternativeText: z.string().optional(),
    caption: z.string().optional(),
  }),
  handler: async (input) => {
    try {
      const results = await Promise.all(
        input.files.map((file) =>
          files.upload(file, {
            fileInfo: {
              ...(input.alternativeText && { alternativeText: input.alternativeText }),
              ...(input.caption && { caption: input.caption }),
            },
          })
        )
      );
      return results;
    } catch (error) {
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  },
});
`;
}
