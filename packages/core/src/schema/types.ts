/**
 * Strapi Schema Types
 * These types represent the structure of Strapi content types
 */

/**
 * Locale from Strapi i18n
 */
export interface StrapiLocale {
  id: number;
  documentId: string;
  name: string;
  code: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

/**
 * Raw schema from Strapi API
 */
export interface StrapiSchema {
  contentTypes: ContentTypeSchema[];
  components: ComponentSchema[];
  locales: StrapiLocale[];
}

/**
 * Content type schema (Strapi v5 structure)
 */
export interface ContentTypeSchema {
  uid: string;
  apiID: string;
  plugin?: string;
  schema: {
    kind: "collectionType" | "singleType";
    singularName: string;
    pluralName: string;
    displayName: string;
    description?: string;
    draftAndPublish?: boolean;
    visible?: boolean;
    pluginOptions?: Record<string, unknown>;
    attributes: Record<string, Attribute>;
  };
}

/**
 * Component schema (Strapi v5 structure)
 */
export interface ComponentSchema {
  uid: string;
  category: string;
  apiId: string;
  schema: {
    displayName: string;
    description?: string;
    collectionName?: string;
    attributes: Record<string, Attribute>;
  };
}

/**
 * Parsed schema (simplified for code generation)
 */
export interface ParsedSchema {
  collections: CollectionType[];
  singles: SingleType[];
  components: ComponentType[];
}

/**
 * Collection type
 */
export interface CollectionType {
  uid: string;
  apiId: string;
  singularName: string;
  pluralName: string;
  displayName: string;
  description?: string;
  draftAndPublish: boolean;
  localized: boolean;
  attributes: Record<string, Attribute>;
}

/**
 * Single type
 */
export interface SingleType {
  uid: string;
  apiId: string;
  singularName: string;
  displayName: string;
  description?: string;
  draftAndPublish: boolean;
  localized: boolean;
  attributes: Record<string, Attribute>;
}

/**
 * Component type
 */
export interface ComponentType {
  uid: string;
  category: string;
  name: string;
  displayName: string;
  description?: string;
  attributes: Record<string, Attribute>;
}

/**
 * Attribute types
 */
export type AttributeType =
  | "string"
  | "text"
  | "richtext"
  | "blocks"
  | "email"
  | "password"
  | "uid"
  | "integer"
  | "biginteger"
  | "float"
  | "decimal"
  | "boolean"
  | "date"
  | "time"
  | "datetime"
  | "timestamp"
  | "json"
  | "enumeration"
  | "media"
  | "relation"
  | "component"
  | "dynamiczone";

/**
 * Base attribute
 */
export interface BaseAttribute {
  type: AttributeType;
  required?: boolean;
  unique?: boolean;
  private?: boolean;
  configurable?: boolean;
  default?: unknown;
}

/**
 * String attribute
 */
export interface StringAttribute extends BaseAttribute {
  type: "string" | "text" | "richtext" | "email" | "password" | "uid";
  minLength?: number;
  maxLength?: number;
  regex?: string;
}

/**
 * Blocks attribute (Strapi v5 rich text)
 */
export interface BlocksAttribute extends BaseAttribute {
  type: "blocks";
}

/**
 * Number attribute
 */
export interface NumberAttribute extends BaseAttribute {
  type: "integer" | "biginteger" | "float" | "decimal";
  min?: number;
  max?: number;
}

/**
 * Boolean attribute
 */
export interface BooleanAttribute extends BaseAttribute {
  type: "boolean";
}

/**
 * Date attribute
 */
export interface DateAttribute extends BaseAttribute {
  type: "date" | "time" | "datetime" | "timestamp";
}

/**
 * JSON attribute
 */
export interface JsonAttribute extends BaseAttribute {
  type: "json";
}

/**
 * Enumeration attribute
 */
export interface EnumerationAttribute extends BaseAttribute {
  type: "enumeration";
  enum: string[];
}

/**
 * Media attribute
 */
export interface MediaAttribute extends BaseAttribute {
  type: "media";
  multiple?: boolean;
  allowedTypes?: ("images" | "videos" | "files" | "audios")[];
}

/**
 * Relation attribute
 */
export interface RelationAttribute extends BaseAttribute {
  type: "relation";
  relation: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
  target: string;
  inversedBy?: string;
  mappedBy?: string;
}

/**
 * Component attribute
 */
export interface ComponentAttribute extends BaseAttribute {
  type: "component";
  component: string;
  repeatable?: boolean;
}

/**
 * Dynamic zone attribute
 */
export interface DynamicZoneAttribute extends BaseAttribute {
  type: "dynamiczone";
  components: string[];
}

/**
 * Union of all attribute types
 */
export type Attribute =
  | StringAttribute
  | BlocksAttribute
  | NumberAttribute
  | BooleanAttribute
  | DateAttribute
  | JsonAttribute
  | EnumerationAttribute
  | MediaAttribute
  | RelationAttribute
  | ComponentAttribute
  | DynamicZoneAttribute;
