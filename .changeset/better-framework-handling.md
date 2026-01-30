---
"strapi2front": minor
"@strapi2front/generators": minor
"@strapi2front/core": minor
---

Major improvements to framework support, JSDoc output, and code organization

**Framework Detection:**
- Non-Astro frameworks: Now allows generating types and services, only disables Astro Actions
- Astro < v4: Warns that Actions require v4+, still generates types and services
- No TypeScript: Automatically uses JSDoc output format

**JSDoc Support:**
- Added JSDoc output format for JavaScript projects (no TypeScript required)
- Types and services can now be generated as .js files with JSDoc annotations
- Full IntelliSense support in VS Code without TypeScript compilation
- Fixed relation type imports using proper JSDoc import syntax
- Fixed locale validation with proper type casting for Prettier compatibility
- Fixed strapi-sdk-js type compatibility issues in generated client code

**Configuration:**
- Added `StrapiIntegrateConfigInput` type for proper deep-partial config input
- `defineConfig()` now accepts partial config without requiring all nested properties
- Config file generation uses appropriate extension (.ts or .js) based on output format

**Code Reorganization:**
- New `/output` folder for TypeScript and JSDoc generators
- New `/frameworks` folder for framework-specific generators (Astro, Next.js, Nuxt)
- New `/shared` folder for shared types and utilities
- Prepared structure for future Next.js Server Actions and Nuxt Server Routes support

**New Exports:**
- `generateTypeScriptTypes`, `generateJSDocTypes` - format-specific type generators
- `generateJSDocServices` - JSDoc service generator
- `generateAstroActions`, `isAstroActionsSupported` - Astro-specific exports
- `frameworkSupport` - framework support status map
- `StrapiIntegrateConfigInput` - input type for defineConfig
