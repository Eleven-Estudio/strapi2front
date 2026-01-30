// Re-export from core for user config files
export { defineConfig } from '@strapi2front/core';
export type { StrapiIntegrateConfig } from '@strapi2front/core';

// CLI exports
export { initCommand } from './commands/init.js';
export { syncCommand } from './commands/sync.js';

// Detectors
export { detectFramework } from './lib/detectors/framework.js';
export { detectTypeScript } from './lib/detectors/typescript.js';
export { detectPackageManager } from './lib/detectors/package-manager.js';

// Utils
export { logger } from './lib/utils/logger.js';
