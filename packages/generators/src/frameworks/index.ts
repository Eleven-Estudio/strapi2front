/**
 * Framework-specific generators
 *
 * Each framework has its own approach to server-side data fetching:
 * - Astro: Actions (v4+)
 * - Next.js: Server Actions (v14+) - Coming Soon
 * - Nuxt: Server Routes (v3+) - Coming Soon
 */

// Astro
export { generateAstroActions, isAstroActionsSupported } from './astro/actions.js';
export type { AstroActionsOptions } from './astro/actions.js';

// Next.js (Coming Soon)
export { generateNextJsActions, isNextJsActionsSupported } from './nextjs/actions.js';
export type { NextJsActionsOptions } from './nextjs/actions.js';

// Nuxt (Coming Soon)
export { generateNuxtServerRoutes, isNuxtServerRoutesSupported } from './nuxt/server-routes.js';
export type { NuxtServerRoutesOptions } from './nuxt/server-routes.js';

/**
 * Supported frameworks for action generation
 */
export type SupportedFramework = 'astro' | 'nextjs' | 'nuxt';

/**
 * Framework support status
 */
export const frameworkSupport: Record<SupportedFramework, { status: 'stable' | 'coming-soon'; minVersion: string }> = {
  astro: { status: 'stable', minVersion: '4.0.0' },
  nextjs: { status: 'coming-soon', minVersion: '14.0.0' },
  nuxt: { status: 'coming-soon', minVersion: '3.0.0' },
};
