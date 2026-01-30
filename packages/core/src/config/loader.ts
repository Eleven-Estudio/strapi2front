import { createJiti } from 'jiti';
import path from 'node:path';
import fs from 'node:fs/promises';
import { config as loadEnv } from 'dotenv';
import { configSchema, type StrapiIntegrateConfig } from './schema.js';

const CONFIG_FILES = ['strapi.config.ts', 'strapi.config.js', 'strapi.config.mjs'];

/**
 * Helper function for defining configuration with type safety
 */
export function defineConfig(config: Partial<StrapiIntegrateConfig>): StrapiIntegrateConfig {
  return configSchema.parse(config);
}

/**
 * Load configuration from strapi.config.ts
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<StrapiIntegrateConfig> {
  // Load environment variables from .env file
  loadEnv({ path: path.join(cwd, '.env') });

  // Find config file
  let configPath: string | null = null;

  for (const file of CONFIG_FILES) {
    const fullPath = path.join(cwd, file);
    try {
      await fs.access(fullPath);
      configPath = fullPath;
      break;
    } catch {
      // File doesn't exist, continue
    }
  }

  if (!configPath) {
    throw new Error(
      `Could not find strapi.config.ts in ${cwd}. Run "npx strapi2front init" first.`
    );
  }

  // Load config using jiti (supports TypeScript)
  const jiti = createJiti(import.meta.url, {
    interopDefault: true,
  });

  try {
    const rawConfig = await jiti.import(configPath);
    const config = (rawConfig as { default?: unknown }).default || rawConfig;

    // Resolve environment variables
    const resolvedConfig = resolveEnvVariables(config as Record<string, unknown>);

    // Validate with Zod
    return configSchema.parse(resolvedConfig);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load config: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Resolve environment variables in config
 */
function resolveEnvVariables(config: Record<string, unknown>): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      // Check if it's a process.env reference that wasn't resolved
      if (value.startsWith('process.env.')) {
        const envKey = value.replace('process.env.', '');
        resolved[key] = process.env[envKey] || value;
      } else {
        resolved[key] = value;
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      resolved[key] = resolveEnvVariables(value as Record<string, unknown>);
    } else {
      resolved[key] = value;
    }
  }

  // Also check for token from environment
  if (!resolved['token'] && process.env['STRAPI_TOKEN']) {
    resolved['token'] = process.env['STRAPI_TOKEN'];
  }

  return resolved;
}
