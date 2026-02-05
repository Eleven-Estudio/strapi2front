# strapi2front

## 0.5.0

### Minor Changes

- feat: Add upload feature with action and public client
  - New `features.upload` option to generate file upload helpers
  - Upload client for browser-side uploads with public token
  - Upload action for server-side uploads via Astro Actions
  - Separate tokens: STRAPI_SYNC_TOKEN (dev) and STRAPI_TOKEN (production)
  - Generate .env.example file on init
  - Add docs links to CLI output
  - Add SvelteKit and TanStack Start to framework support

### Patch Changes

- Updated dependencies
  - @strapi2front/[core@0.5.0](mailto:core@0.5.0)
  - @strapi2front/[generators@0.5.0](mailto:generators@0.5.0)
  - @strapi2front/[client@0.5.0](mailto:client@0.5.0)

## 0.4.2

### Patch Changes

- Add token permissions hint in init command
  Show required Strapi Content-type-builder permissions before asking for API token

## 0.4.1

### Patch Changes

- Generate strapi.config.js with correct ESM/CommonJS syntax
  - Auto-detect module type and generate appropriate syntax
  - ESM projects get `import`/`export default` syntax
  - CommonJS projects get `require`/`module.exports` syntax
  - Support loading .cjs config files
- Updated dependencies
  - @strapi2front/[core@0.4.1](mailto:core@0.4.1)
  - @strapi2front/[generators@0.4.1](mailto:generators@0.4.1)

## 0.4.0

### Minor Changes

- Add ES Modules support for JSDoc output
  - Auto-detect module type from package.json "type" field or .mjs config files
  - Generate `import`/`export` syntax for ESM projects
  - Generate `require`/`module.exports` syntax for CommonJS projects
  - Add `moduleType` config option for manual override
  - Next.js and other modern frameworks with ESM are now fully supported

### Patch Changes

- Updated dependencies
  - @strapi2front/[core@0.4.0](mailto:core@0.4.0)
  - @strapi2front/[generators@0.4.0](mailto:generators@0.4.0)

## 0.3.2

### Patch Changes

- Fix JSDoc type casting in shared utils flattenV4Response function
- Updated dependencies
  - @strapi2front/[generators@0.3.2](mailto:generators@0.3.2)

## 0.3.1

### Patch Changes

- Fix JSDoc type casting issues in Strapi v4 client
  - Use intermediate 'any' type casts to bypass TypeScript generic constraints
  - Fixes type errors in flattenItem and flattenRelations functions
  - Resolves "Type 'X' is not assignable to type 'T'" errors in generated code
- Updated dependencies
  - @strapi2front/[generators@0.3.1](mailto:generators@0.3.1)

## 0.3.0

### Minor Changes

- 5863929: Major improvements to framework support, JSDoc output, and code organization
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

### Patch Changes

- Updated dependencies [5863929]
  - @strapi2front/[generators@0.3.0](mailto:generators@0.3.0)
  - @strapi2front/[core@0.3.0](mailto:core@0.3.0)

## 0.2.3

### Patch Changes

- 96fd0b4: Always save apiPrefix in config file, even when using default value

## 0.2.2

### Patch Changes

- c33e44b: Move API prefix prompt from sync to init command for better UX

## 0.2.1

### Patch Changes

- 52f3f7c: Add interactive prompt for API prefix during sync command

## 0.2.0

### Minor Changes

- feat: add configurable API prefix support
  Users can now configure custom API prefixes for Strapi instances
  that don't use the default "/api" prefix. Set `apiPrefix` in config
  or use `STRAPI_API_PREFIX` environment variable.

### Patch Changes

- Updated dependencies
  - @strapi2front/[core@0.2.0](mailto:core@0.2.0)
  - @strapi2front/[generators@0.2.0](mailto:generators@0.2.0)

## 0.1.6

### Patch Changes

- docs: include README in npm package for display on npmjs.com

## 0.1.5

### Patch Changes

- fix: silence dotenv promotional logs in CLI output
- Updated dependencies
  - @strapi2front/[core@0.1.5](mailto:core@0.1.5)
  - @strapi2front/[generators@0.1.5](mailto:generators@0.1.5)

## 0.1.4

### Patch Changes

- fix: correct import paths for relations in components (by-feature structure)
  Components now correctly import from ../collections/ instead of ../../collections/
- Updated dependencies
  - @strapi2front/[generators@0.1.4](mailto:generators@0.1.4)

## 0.1.3

### Patch Changes

- fix: add spinner animation during dependency installation
  Changed from sync to async execution so spinners animate while
  dependencies are being installed, providing visual feedback.

## 0.1.2

### Patch Changes

- fix: rename all package references from strapi-integrate to strapi2front
  - Fix import in generated config file to use correct package name
  - Update CLI command references in messages and prompts
  - Add automatic installation of strapi2front as dev dependency during init
  - Update all "Generated by" comments in generators
- Updated dependencies
  - @strapi2front/[core@0.1.2](mailto:core@0.1.2)
  - @strapi2front/[generators@0.1.2](mailto:generators@0.1.2)

## 0.1.1

### Patch Changes

- a4c0421: Run init command by default when no arguments provided

