// Config exports
export { loadConfig, defineConfig } from "./config/loader.js";
export { configSchema } from "./config/schema.js";
export type { StrapiIntegrateConfig } from "./config/schema.js";

// Schema exports
export { fetchSchema, testConnection, detectStrapiVersion } from "./schema/fetcher.js";
export type { StrapiVersion, VersionDetectionResult } from "./schema/fetcher.js";
export { parseSchema, uidToIdentifier, toPascalCase, toCamelCase, toKebabCase } from "./schema/parser.js";
export type {
  StrapiSchema,
  ContentTypeSchema,
  ComponentSchema,
  ParsedSchema,
  CollectionType,
  SingleType,
  ComponentType,
  Attribute,
  AttributeType,
  StringAttribute,
  BlocksAttribute,
  NumberAttribute,
  BooleanAttribute,
  DateAttribute,
  JsonAttribute,
  EnumerationAttribute,
  MediaAttribute,
  RelationAttribute,
  ComponentAttribute,
  DynamicZoneAttribute,
  StrapiLocale,
} from "./schema/types.js";
