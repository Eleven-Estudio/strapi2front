# @strapi2front/client

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
