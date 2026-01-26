// Type generator
export { generateTypes } from './types/generator.js';
export type { TypeGeneratorOptions } from './types/generator.js';

// Service generator
export { generateServices } from './services/generator.js';
export type { ServiceGeneratorOptions } from './services/generator.js';

// Actions generator
export { generateActions } from './actions/generator.js';
export type { ActionsGeneratorOptions } from './actions/generator.js';

// Client generator
export { generateClient } from './client/generator.js';
export type { ClientGeneratorOptions } from './client/generator.js';

// Locales generator
export { generateLocales } from './locales/generator.js';
export type { LocalesGeneratorOptions } from './locales/generator.js';

// By-feature generator (screaming architecture)
export { generateByFeature } from './by-feature/generator.js';
export type { ByFeatureGeneratorOptions } from './by-feature/generator.js';

// Utilities
export * from './utils/index.js';
