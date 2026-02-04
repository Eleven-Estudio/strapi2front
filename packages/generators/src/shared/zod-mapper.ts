/**
 * Zod Schema mapping utilities
 * Converts Strapi attributes to Zod schema strings
 *
 * Note: This mapper generates Zod schema code as strings
 * that will be written to generated files.
 */

import type {
  Attribute,
  StringAttribute,
  NumberAttribute,
  EnumerationAttribute,
  MediaAttribute,
  RelationAttribute,
  ComponentAttribute,
  DynamicZoneAttribute,
} from '@strapi2front/core';

/**
 * Options for schema generation
 */
export interface ZodMapperOptions {
  /** Whether this is for an update schema (all fields optional) */
  isUpdate?: boolean;
  /** Whether to include relation fields */
  includeRelations?: boolean;
  /** Whether to include media fields */
  includeMedia?: boolean;
  /** Whether to include component fields */
  includeComponents?: boolean;
  /** Strapi version - affects ID types (v4: number, v5: string documentId) */
  strapiVersion?: 'v4' | 'v5';
  /**
   * Use advanced relation format with connect/disconnect/set
   * @default false - uses simple ID arrays
   */
  useAdvancedRelations?: boolean;
}

/**
 * Result of mapping an attribute to Zod
 */
export interface ZodMappedAttribute {
  /** The Zod schema string (e.g., "z.string().min(1)") */
  schema: string;
  /** Whether this field should be skipped in generation */
  skip: boolean;
  /** Reason for skipping (if skip is true) */
  skipReason?: string;
}

/**
 * System fields that should be excluded from create/update schemas
 */
const SYSTEM_FIELDS = new Set([
  'id',
  'documentId',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
  'localizations',
  'locale',
]);

/**
 * Check if a field is a system field
 */
export function isSystemField(fieldName: string): boolean {
  return SYSTEM_FIELDS.has(fieldName);
}

/**
 * Map a Strapi attribute to a Zod schema string
 */
export function mapAttributeToZodSchema(
  attr: Attribute,
  options: ZodMapperOptions = {}
): ZodMappedAttribute {
  const { isUpdate = false } = options;

  // Build the base schema
  let schema = buildBaseSchema(attr, options);

  // If schema is empty, it means we should skip this field
  if (!schema) {
    return { schema: '', skip: true, skipReason: 'Unsupported type' };
  }

  // Apply required/optional modifiers
  // For update schemas, all fields are optional
  // For create schemas, only non-required fields are optional
  if (isUpdate || !attr.required) {
    schema = `${schema}.optional()`;
  }

  // Apply default if present and not an update schema
  if (!isUpdate && attr.default !== undefined && attr.default !== null) {
    const defaultValue = formatDefaultValue(attr.default, attr.type);
    if (defaultValue !== null) {
      schema = `${schema}.default(${defaultValue})`;
    }
  }

  return { schema, skip: false };
}

/**
 * Build the base Zod schema for an attribute (without optional/default modifiers)
 */
function buildBaseSchema(attr: Attribute, options: ZodMapperOptions): string | null {
  switch (attr.type) {
    // String types
    case 'string':
    case 'text':
    case 'richtext':
    case 'uid':
      return buildStringSchema(attr as StringAttribute);

    case 'email':
      return buildEmailSchema(attr as StringAttribute);

    case 'password':
      return buildPasswordSchema(attr as StringAttribute);

    // Blocks (Strapi v5 rich text)
    case 'blocks':
      return 'z.array(z.record(z.unknown()))';

    // Number types
    case 'integer':
    case 'biginteger':
      return buildIntegerSchema(attr as NumberAttribute);

    case 'float':
    case 'decimal':
      return buildFloatSchema(attr as NumberAttribute);

    // Boolean
    case 'boolean':
      return 'z.boolean()';

    // Date types
    case 'date':
      return 'z.string().date()';

    case 'time':
      return 'z.string().time()';

    case 'datetime':
    case 'timestamp':
      return 'z.string().datetime({ offset: true })';

    // JSON
    case 'json':
      return 'z.record(z.unknown())';

    // Enumeration
    case 'enumeration':
      return buildEnumSchema(attr as EnumerationAttribute);

    // Media - accepts file IDs (numbers) from upload API
    case 'media':
      return buildMediaSchema(attr as MediaAttribute);

    // Relation - accepts documentIds (v5) or ids (v4)
    case 'relation':
      return buildRelationSchema(attr as RelationAttribute, options);

    // Component - TODO: Implement with component schemas
    case 'component':
      if (!options.includeComponents) {
        return buildComponentSchema(attr as ComponentAttribute);
      }
      return buildComponentSchema(attr as ComponentAttribute);

    // Dynamic zone - TODO: Implement with component schemas
    case 'dynamiczone':
      return buildDynamicZoneSchema(attr as DynamicZoneAttribute);

    default:
      return 'z.unknown()';
  }
}

/**
 * Build Zod schema for string attributes
 */
function buildStringSchema(attr: StringAttribute): string {
  const parts: string[] = ['z.string()'];

  if (attr.minLength !== undefined) {
    parts.push(`.min(${attr.minLength})`);
  }

  if (attr.maxLength !== undefined) {
    parts.push(`.max(${attr.maxLength})`);
  }

  if (attr.regex) {
    // Escape the regex for string literal
    const escapedRegex = attr.regex.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    parts.push(`.regex(new RegExp('${escapedRegex}'))`);
  }

  return parts.join('');
}

/**
 * Build Zod schema for email attributes
 */
function buildEmailSchema(attr: StringAttribute): string {
  let schema = 'z.string().email()';

  if (attr.minLength !== undefined) {
    schema += `.min(${attr.minLength})`;
  }

  if (attr.maxLength !== undefined) {
    schema += `.max(${attr.maxLength})`;
  }

  return schema;
}

/**
 * Build Zod schema for password attributes
 */
function buildPasswordSchema(attr: StringAttribute): string {
  let schema = 'z.string()';

  // Passwords typically have a minimum length
  const minLength = attr.minLength ?? 6;
  schema += `.min(${minLength})`;

  if (attr.maxLength !== undefined) {
    schema += `.max(${attr.maxLength})`;
  }

  return schema;
}

/**
 * Build Zod schema for integer attributes
 */
function buildIntegerSchema(attr: NumberAttribute): string {
  const parts: string[] = ['z.number().int()'];

  if (attr.min !== undefined) {
    parts.push(`.min(${attr.min})`);
  }

  if (attr.max !== undefined) {
    parts.push(`.max(${attr.max})`);
  }

  return parts.join('');
}

/**
 * Build Zod schema for float/decimal attributes
 */
function buildFloatSchema(attr: NumberAttribute): string {
  const parts: string[] = ['z.number()'];

  if (attr.min !== undefined) {
    parts.push(`.min(${attr.min})`);
  }

  if (attr.max !== undefined) {
    parts.push(`.max(${attr.max})`);
  }

  return parts.join('');
}

/**
 * Build Zod schema for enumeration attributes
 */
function buildEnumSchema(attr: EnumerationAttribute): string {
  if (!attr.enum || attr.enum.length === 0) {
    return 'z.string()';
  }

  const enumValues = attr.enum.map((v) => `'${v}'`).join(', ');
  return `z.enum([${enumValues}])`;
}

/**
 * Build Zod schema for media attributes
 *
 * For create/update operations, media fields accept:
 * - Single: number (media ID) or null to remove
 * - Multiple: array of numbers (media IDs)
 *
 * Note: Files must be uploaded first via the upload API (/api/upload),
 * then the returned file IDs are used here to link to the entry.
 *
 * @example
 * // Single media
 * { cover: 42 }        // Link file with ID 42
 * { cover: null }      // Remove the linked file
 *
 * // Multiple media
 * { gallery: [1, 2, 3] }  // Link files with IDs 1, 2, 3
 * { gallery: [] }         // Remove all linked files
 */
function buildMediaSchema(attr: MediaAttribute): string {
  if (attr.multiple) {
    // Multiple media: array of file IDs (numbers)
    // Empty array is valid to remove all files
    return 'z.array(z.number().int().positive()).default([])';
  }
  // Single media: file ID (number) or null to remove
  return 'z.number().int().positive().nullable()';
}

/**
 * Build Zod schema for relation attributes
 *
 * For create/update operations, relations accept:
 *
 * **Simple format (default):**
 * - oneToOne/manyToOne: documentId (string in v5, number in v4) or null
 * - oneToMany/manyToMany: array of documentIds
 *
 * **Advanced format (Strapi v5 with useAdvancedRelations):**
 * Supports connect, disconnect, and set operations with full options:
 * - connect: Add relations while preserving existing ones
 * - disconnect: Remove specific relations
 * - set: Replace ALL relations (cannot combine with connect/disconnect)
 *
 * Each relation item can specify:
 * - documentId: Required - the document to relate
 * - locale: Optional - for i18n content types
 * - status: Optional - 'draft' or 'published' for draft & publish
 * - position: Optional - ordering (before, after, start, end)
 *
 * @see https://docs.strapi.io/dev-docs/api/rest/relations
 *
 * @example
 * // Simple format (v5)
 * { author: "abc123" }              // Link to document
 * { author: null }                  // Remove relation
 * { tags: ["id1", "id2"] }          // Link multiple documents (shorthand)
 *
 * // Advanced format - connect with position
 * {
 *   categories: {
 *     connect: [
 *       { documentId: "id1", position: { start: true } },
 *       { documentId: "id2", position: { after: "id1" } }
 *     ]
 *   }
 * }
 *
 * // Advanced format - with locale and status (i18n + draft/publish)
 * {
 *   categories: {
 *     connect: [
 *       { documentId: "id1", locale: "en", status: "published" },
 *       { documentId: "id1", locale: "fr", status: "draft" }
 *     ]
 *   }
 * }
 *
 * // Advanced format - combine connect and disconnect
 * {
 *   tags: {
 *     connect: [{ documentId: "newTag" }],
 *     disconnect: [{ documentId: "oldTag" }]
 *   }
 * }
 *
 * // Advanced format - set (replaces all)
 * {
 *   tags: {
 *     set: ["id1", "id2"]  // Shorthand
 *   }
 * }
 */
function buildRelationSchema(attr: RelationAttribute, options: ZodMapperOptions = {}): string {
  const isMany = attr.relation === 'oneToMany' || attr.relation === 'manyToMany';
  const isV5 = options.strapiVersion !== 'v4';
  const useAdvanced = options.useAdvancedRelations && isV5;

  // ID type depends on Strapi version
  // v5 uses documentId (string), v4 uses id (number)
  const idSchema = isV5 ? 'z.string()' : 'z.number().int().positive()';

  if (useAdvanced) {
    // Position schema for ordering relations
    const positionSchema = `z.object({
    before: z.string().optional(),
    after: z.string().optional(),
    start: z.boolean().optional(),
    end: z.boolean().optional(),
  }).optional()`;

    // Full relation item schema with all options (longhand)
    const relationItemSchema = `z.object({
    documentId: ${idSchema},
    /** Locale for i18n content types */
    locale: z.string().optional(),
    /** Target draft or published version */
    status: z.enum(['draft', 'published']).optional(),
    /** Position for ordering */
    position: ${positionSchema},
  })`;

    // Shorthand: just documentId string/number
    // Longhand: full object with options
    const itemOrIdSchema = `z.union([${idSchema}, ${relationItemSchema}])`;

    // Disconnect only needs documentId (and optionally locale/status)
    const disconnectItemSchema = `z.union([
    ${idSchema},
    z.object({
      documentId: ${idSchema},
      locale: z.string().optional(),
      status: z.enum(['draft', 'published']).optional(),
    })
  ])`;

    // Advanced relation format
    // Note: set cannot be combined with connect/disconnect
    return `z.union([
  // Shorthand: array of documentIds (equivalent to set)
  z.array(${idSchema}),
  // Longhand: object with connect/disconnect/set
  z.object({
    /** Add relations while preserving existing ones */
    connect: z.array(${itemOrIdSchema}).optional(),
    /** Remove specific relations */
    disconnect: z.array(${disconnectItemSchema}).optional(),
    /** Replace ALL relations (cannot combine with connect/disconnect) */
    set: z.array(${itemOrIdSchema}).optional(),
  })
]).optional()`;
  }

  // Simple format: just IDs
  if (isMany) {
    return `z.array(${idSchema}).default([])`;
  }

  return `${idSchema}.nullable()`;
}

/**
 * Build Zod schema for component attributes
 *
 * TODO: This should reference the component's schema
 * For now, using a generic object schema
 */
function buildComponentSchema(attr: ComponentAttribute): string {
  if (attr.repeatable) {
    return 'z.array(z.record(z.unknown()))';
  }
  return 'z.record(z.unknown()).nullable()';
}

/**
 * Build Zod schema for dynamic zone attributes
 *
 * TODO: This should be a union of component schemas
 * For now, using a generic array schema
 */
function buildDynamicZoneSchema(_attr: DynamicZoneAttribute): string {
  return 'z.array(z.record(z.unknown()))';
}

/**
 * Format a default value for Zod
 */
function formatDefaultValue(value: unknown, type: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  switch (type) {
    case 'string':
    case 'text':
    case 'richtext':
    case 'email':
    case 'uid':
      return typeof value === 'string' ? `'${value.replace(/'/g, "\\'")}'` : null;

    case 'integer':
    case 'biginteger':
    case 'float':
    case 'decimal':
      return typeof value === 'number' ? String(value) : null;

    case 'boolean':
      return typeof value === 'boolean' ? String(value) : null;

    case 'enumeration':
      return typeof value === 'string' ? `'${value}'` : null;

    default:
      return null;
  }
}

/**
 * Generate a complete Zod object schema from attributes
 */
export function generateZodObjectSchema(
  attributes: Record<string, Attribute>,
  options: ZodMapperOptions = {}
): { schema: string; skippedFields: Array<{ name: string; reason: string }> } {
  const fields: string[] = [];
  const skippedFields: Array<{ name: string; reason: string }> = [];

  for (const [name, attr] of Object.entries(attributes)) {
    // Skip system fields
    if (isSystemField(name)) {
      continue;
    }

    // Skip private fields
    if (attr.private) {
      skippedFields.push({ name, reason: 'Private field' });
      continue;
    }

    const mapped = mapAttributeToZodSchema(attr, options);

    if (mapped.skip) {
      skippedFields.push({ name, reason: mapped.skipReason || 'Unknown' });
      continue;
    }

    fields.push(`  ${name}: ${mapped.schema},`);
  }

  const schema = `z.object({\n${fields.join('\n')}\n})`;

  return { schema, skippedFields };
}
