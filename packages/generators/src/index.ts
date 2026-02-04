/**
 * strapi2front Generators
 *
 * Generates TypeScript/JSDoc types, services, and framework-specific actions
 * from Strapi content type schemas.
 */

// =============================================================================
// Type generator
// =============================================================================
export { generateTypes } from './types/generator.js';
export type { TypeGeneratorOptions } from './types/generator.js';

// =============================================================================
// Service generator
// =============================================================================
export { generateServices } from './services/generator.js';
export type { ServiceGeneratorOptions } from './services/generator.js';

// =============================================================================
// Actions generator (Astro - backwards compatible)
// =============================================================================
export { generateActions } from './actions/generator.js';
export type { ActionsGeneratorOptions } from './actions/generator.js';

// =============================================================================
// Client generator
// =============================================================================
export { generateClient } from './client/generator.js';
export type { ClientGeneratorOptions } from './client/generator.js';

// =============================================================================
// Locales generator
// =============================================================================
export { generateLocales } from './locales/generator.js';
export type { LocalesGeneratorOptions } from './locales/generator.js';

// =============================================================================
// By-feature generator (screaming architecture)
// =============================================================================
export { generateByFeature } from './by-feature/generator.js';
export type { ByFeatureGeneratorOptions } from './by-feature/generator.js';

// =============================================================================
// Framework-specific generators
// =============================================================================
export {
  generateAstroActions,
  isAstroActionsSupported,
  generateNextJsActions,
  isNextJsActionsSupported,
  generateNuxtServerRoutes,
  isNuxtServerRoutesSupported,
  frameworkSupport,
} from './frameworks/index.js';
export type {
  AstroActionsOptions,
  NextJsActionsOptions,
  NuxtServerRoutesOptions,
  SupportedFramework,
} from './frameworks/index.js';

// =============================================================================
// Output format generators
// =============================================================================
export {
  generateTypeScriptTypes,
  generateJSDocTypes,
  generateJSDocServices,
  generateZodSchemas,
} from './output/index.js';
export type {
  TypeScriptTypesOptions,
  JSDocTypesOptions,
  JSDocServicesOptions,
  ZodSchemasOptions,
  GeneratedSchemaInfo,
} from './output/index.js';

// =============================================================================
// Zod schema mapping utilities
// =============================================================================
export {
  mapAttributeToZodSchema,
  generateZodObjectSchema,
  isSystemField,
} from './shared/zod-mapper.js';
export type {
  ZodMapperOptions,
  ZodMappedAttribute,
} from './shared/zod-mapper.js';

// =============================================================================
// Shared types
// =============================================================================
export type {
  OutputFormat,
  Framework,
  StrapiVersion,
  BaseGeneratorOptions,
  GeneratorContext,
  GeneratorResult,
} from './shared/types.js';

// =============================================================================
// Utilities
// =============================================================================
export * from './utils/index.js';
