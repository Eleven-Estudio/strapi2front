import type {
  StrapiSchema,
  ParsedSchema,
  CollectionType,
  SingleType,
  ComponentType,
  Attribute,
} from './types.js';

/**
 * Parse raw Strapi schema into a structured format for code generation
 */
export function parseSchema(schema: StrapiSchema): ParsedSchema {
  const collections: CollectionType[] = [];
  const singles: SingleType[] = [];

  for (const ct of schema.contentTypes) {
    const { kind, singularName, pluralName, displayName, description, draftAndPublish, pluginOptions, attributes } = ct.schema;

    // Filter out system attributes
    const filteredAttributes = filterSystemAttributes(attributes);

    // Check if i18n is enabled for this content type
    const localized = Boolean(
      pluginOptions?.i18n &&
      typeof pluginOptions.i18n === 'object' &&
      (pluginOptions.i18n as Record<string, unknown>).localized
    );

    if (kind === 'collectionType') {
      collections.push({
        uid: ct.uid,
        apiId: ct.apiID,
        singularName,
        pluralName,
        displayName,
        description,
        draftAndPublish: draftAndPublish ?? false,
        localized,
        attributes: filteredAttributes,
      });
    } else if (kind === 'singleType') {
      singles.push({
        uid: ct.uid,
        apiId: ct.apiID,
        singularName,
        displayName,
        description,
        draftAndPublish: draftAndPublish ?? false,
        localized,
        attributes: filteredAttributes,
      });
    }
  }

  // Parse components
  const components: ComponentType[] = schema.components.map((comp) => {
    const filteredAttributes = filterSystemAttributes(comp.schema.attributes);

    return {
      uid: comp.uid,
      category: comp.category,
      name: comp.apiId,
      displayName: comp.schema.displayName,
      description: comp.schema.description,
      attributes: filteredAttributes,
    };
  });

  // Sort alphabetically
  collections.sort((a, b) => a.singularName.localeCompare(b.singularName));
  singles.sort((a, b) => a.singularName.localeCompare(b.singularName));
  components.sort((a, b) => a.name.localeCompare(b.name));

  return {
    collections,
    singles,
    components,
  };
}

/**
 * Filter out system attributes that shouldn't be in the generated types
 */
function filterSystemAttributes(
  attributes: Record<string, Attribute>
): Record<string, Attribute> {
  const SYSTEM_ATTRIBUTES = [
    'createdBy',
    'updatedBy',
    'localizations',
    'locale',
  ];

  const filtered: Record<string, Attribute> = {};

  for (const [key, value] of Object.entries(attributes)) {
    // Skip system attributes
    if (SYSTEM_ATTRIBUTES.includes(key)) {
      continue;
    }

    // Skip private attributes
    if (value.private === true) {
      continue;
    }

    filtered[key] = value;
  }

  return filtered;
}

/**
 * Get the API endpoint name for a content type
 */
export function getApiEndpoint(singularName: string, pluralName: string): string {
  return pluralName || `${singularName}s`;
}

/**
 * Convert uid to a valid TypeScript identifier
 */
export function uidToIdentifier(uid: string): string {
  // api::post.post -> Post
  // api::blog-post.blog-post -> BlogPost
  const parts = uid.split('.');
  const name = parts[parts.length - 1] || uid;

  return toPascalCase(name);
}

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
