/**
 * Service generator
 * Supports TypeScript (.ts) and JSDoc (.js) output formats
 */

import path from 'node:path';
import type { ParsedSchema, CollectionType, SingleType } from '@strapi2front/core';
import type { OutputFormat, StrapiVersion } from '../shared/types.js';
import { formatCode } from '../utils/formatter.js';
import { writeFile, ensureDir } from '../utils/file.js';
import { toPascalCase, toCamelCase, toKebabCase } from '../utils/naming.js';
import { generateJSDocServices } from '../output/jsdoc/services.js';

export interface ServiceGeneratorOptions {
  outputDir: string;
  typesImportPath: string;
  strapiVersion?: StrapiVersion;
  /**
   * Output format: 'typescript' for .ts files, 'jsdoc' for .js with JSDoc annotations
   * @default 'typescript'
   */
  outputFormat?: OutputFormat;
}

/**
 * Generate service files from parsed schema
 */
export async function generateServices(
  schema: ParsedSchema,
  options: ServiceGeneratorOptions
): Promise<string[]> {
  const outputFormat = options.outputFormat ?? 'typescript';

  if (outputFormat === 'jsdoc') {
    return generateJSDocServices(schema, {
      outputDir: options.outputDir,
      typesImportPath: options.typesImportPath,
      strapiVersion: options.strapiVersion,
    });
  }

  // Default: TypeScript
  return generateTypeScriptServices(schema, options);
}

/**
 * Generate TypeScript service files
 */
async function generateTypeScriptServices(
  schema: ParsedSchema,
  options: ServiceGeneratorOptions
): Promise<string[]> {
  const { outputDir, typesImportPath, strapiVersion = "v5" } = options;
  const generatedFiles: string[] = [];

  await ensureDir(outputDir);

  // Generate services for collections
  for (const collection of schema.collections) {
    const fileName = `${toKebabCase(collection.singularName)}.service.ts`;
    const filePath = path.join(outputDir, fileName);
    const content = generateCollectionService(collection, typesImportPath, strapiVersion);
    await writeFile(filePath, await formatCode(content));
    generatedFiles.push(filePath);
  }

  // Generate services for single types
  for (const single of schema.singles) {
    const fileName = `${toKebabCase(single.singularName)}.service.ts`;
    const filePath = path.join(outputDir, fileName);
    const content = generateSingleService(single, typesImportPath, strapiVersion);
    await writeFile(filePath, await formatCode(content));
    generatedFiles.push(filePath);
  }

  return generatedFiles;
}

/**
 * Generate service for a collection type
 */
function generateCollectionService(collection: CollectionType, typesImportPath: string, strapiVersion: StrapiVersion): string {
  const typeName = toPascalCase(collection.singularName);
  const serviceName = toCamelCase(collection.singularName) + 'Service';
  const fileName = toKebabCase(collection.singularName);
  const endpoint = collection.pluralName;
  const isV4 = strapiVersion === "v4";

  // V4 uses `id: number`, V5 uses `documentId: string`
  const idParam = isV4 ? 'id: number' : 'documentId: string';
  const idName = isV4 ? 'id' : 'documentId';
  const omitFields = isV4
    ? "'id' | 'createdAt' | 'updatedAt' | 'publishedAt'"
    : "'id' | 'documentId' | 'createdAt' | 'updatedAt' | 'publishedAt'";

  // Feature flags
  const hasSlug = 'slug' in collection.attributes;
  const { localized, draftAndPublish } = collection;

  // Build imports
  const imports: string[] = [
    `import { collection } from '../client';`,
    `import type { ${typeName}, ${typeName}Filters } from '${typesImportPath}/collections/${fileName}';`,
    `import type { StrapiPagination } from '${typesImportPath}/utils';`,
  ];
  if (localized) {
    imports.push(`import type { Locale } from '../locales';`);
  }

  // Build FindManyOptions interface
  const findManyOptionsFields: string[] = [
    `  filters?: ${typeName}Filters;`,
    `  pagination?: {`,
    `    /** Page number (1-indexed) - use with pageSize */`,
    `    page?: number;`,
    `    /** Number of items per page (default: 25) - use with page */`,
    `    pageSize?: number;`,
    `    /** Offset to start from (0-indexed) - use with limit */`,
    `    start?: number;`,
    `    /** Maximum number of items to return - use with start */`,
    `    limit?: number;`,
    `  };`,
    `  sort?: string | string[];`,
    `  populate?: string | string[] | Record<string, unknown>;`,
  ];
  if (localized) {
    findManyOptionsFields.push(`  locale?: Locale;`);
  }
  if (draftAndPublish) {
    findManyOptionsFields.push(`  status?: 'draft' | 'published';`);
  }

  // Build FindOneOptions interface
  const findOneOptionsFields: string[] = [
    `  populate?: string | string[] | Record<string, unknown>;`,
  ];
  if (localized) {
    findOneOptionsFields.push(`  locale?: Locale;`);
  }
  if (draftAndPublish) {
    findOneOptionsFields.push(`  status?: 'draft' | 'published';`);
  }

  // Build find params
  const findParams: string[] = [
    `      filters: options.filters,`,
    `      pagination: options.pagination,`,
    `      sort: options.sort,`,
    `      populate: options.populate,`,
  ];
  if (localized) {
    findParams.push(`      locale: options.locale,`);
  }
  if (draftAndPublish) {
    findParams.push(`      status: options.status,`);
  }

  // Build findOne params
  const findOneParams: string[] = [
    `        populate: options.populate,`,
  ];
  if (localized) {
    findOneParams.push(`        locale: options.locale,`);
  }
  if (draftAndPublish) {
    findOneParams.push(`        status: options.status,`);
  }

  // Build findBySlug params
  const findBySlugParams: string[] = [
    `      populate: options.populate,`,
  ];
  if (localized) {
    findBySlugParams.push(`      locale: options.locale,`);
  }
  if (draftAndPublish) {
    findBySlugParams.push(`      status: options.status,`);
  }

  return `/**
 * ${collection.displayName} Service
 * ${collection.description || ''}
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

${imports.join('\n')}

export interface FindManyOptions {
${findManyOptionsFields.join('\n')}
}

export interface FindOneOptions {
${findOneOptionsFields.join('\n')}
}

// Create typed collection helper
const ${toCamelCase(collection.singularName)}Collection = collection<${typeName}>('${endpoint}');

export const ${serviceName} = {
  /**
   * Find multiple ${collection.pluralName}
   */
  async findMany(options: FindManyOptions = {}): Promise<{ data: ${typeName}[]; pagination: StrapiPagination }> {
    const response = await ${toCamelCase(collection.singularName)}Collection.find({
${findParams.join('\n')}
    });

    return {
      data: response.data,
      pagination: response.meta.pagination,
    };
  },

  /**
   * Find all ${collection.pluralName} (handles pagination automatically)
   */
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

  /**
   * Find one ${collection.singularName} by ${idName}
   */
  async findOne(${idParam}, options: FindOneOptions = {}): Promise<${typeName} | null> {
    try {
      const response = await ${toCamelCase(collection.singularName)}Collection.findOne(${idName}, {
${findOneParams.join('\n')}
      });

      return response.data;
    } catch (error) {
      // Return null if not found
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },
${hasSlug ? `
  /**
   * Find one ${collection.singularName} by slug
   */
  async findBySlug(slug: string, options: FindOneOptions = {}): Promise<${typeName} | null> {
    const { data } = await this.findMany({
      filters: { slug: { $eq: slug } } as ${typeName}Filters,
      pagination: { pageSize: 1 },
${findBySlugParams.join('\n')}
    });

    return data[0] || null;
  },
` : ''}
  /**
   * Create a new ${collection.singularName}
   */
  async create(data: Partial<Omit<${typeName}, ${omitFields}>>): Promise<${typeName}> {
    const response = await ${toCamelCase(collection.singularName)}Collection.create({ data });
    return response.data;
  },

  /**
   * Update a ${collection.singularName}
   */
  async update(${idParam}, data: Partial<Omit<${typeName}, ${omitFields}>>): Promise<${typeName}> {
    const response = await ${toCamelCase(collection.singularName)}Collection.update(${idName}, { data });
    return response.data;
  },

  /**
   * Delete a ${collection.singularName}
   */
  async delete(${idParam}): Promise<void> {
    await ${toCamelCase(collection.singularName)}Collection.delete(${idName});
  },

  /**
   * Count ${collection.pluralName}
   */
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

/**
 * Generate service for a single type
 */
function generateSingleService(single: SingleType, typesImportPath: string, strapiVersion: StrapiVersion): string {
  const typeName = toPascalCase(single.singularName);
  const serviceName = toCamelCase(single.singularName) + 'Service';
  const fileName = toKebabCase(single.singularName);
  const endpoint = single.singularName;
  const isV4 = strapiVersion === "v4";

  // V4 doesn't have documentId
  const omitFields = isV4
    ? "'id' | 'createdAt' | 'updatedAt'"
    : "'id' | 'documentId' | 'createdAt' | 'updatedAt'";

  // Feature flags
  const { localized, draftAndPublish } = single;

  // Build imports
  const imports: string[] = [
    `import { single } from '../client';`,
    `import type { ${typeName} } from '${typesImportPath}/collections/${fileName}';`,
  ];
  if (localized) {
    imports.push(`import type { Locale } from '../locales';`);
  }

  // Build FindOptions interface
  const findOptionsFields: string[] = [
    `  populate?: string | string[] | Record<string, unknown>;`,
  ];
  if (localized) {
    findOptionsFields.push(`  locale?: Locale;`);
  }
  if (draftAndPublish) {
    findOptionsFields.push(`  status?: 'draft' | 'published';`);
  }

  // Build find params
  const findParams: string[] = [
    `        populate: options.populate,`,
  ];
  if (localized) {
    findParams.push(`        locale: options.locale,`);
  }
  if (draftAndPublish) {
    findParams.push(`        status: options.status,`);
  }

  return `/**
 * ${single.displayName} Service (Single Type)
 * ${single.description || ''}
 * Generated by strapi2front
 * Strapi version: ${strapiVersion}
 */

${imports.join('\n')}

export interface FindOptions {
${findOptionsFields.join('\n')}
}

// Create typed single helper
const ${toCamelCase(single.singularName)}Single = single<${typeName}>('${endpoint}');

export const ${serviceName} = {
  /**
   * Get ${single.displayName}
   */
  async find(options: FindOptions = {}): Promise<${typeName} | null> {
    try {
      const response = await ${toCamelCase(single.singularName)}Single.find({
${findParams.join('\n')}
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
   * Update ${single.displayName}
   */
  async update(data: Partial<Omit<${typeName}, ${omitFields}>>): Promise<${typeName}> {
    const response = await ${toCamelCase(single.singularName)}Single.update({ data });
    return response.data;
  },

  /**
   * Delete ${single.displayName}
   */
  async delete(): Promise<void> {
    await ${toCamelCase(single.singularName)}Single.delete();
  },
};
`;
}
