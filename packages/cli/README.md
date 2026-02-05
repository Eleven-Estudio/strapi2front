<div align="center">
  <!-- <a href="https://strapi2front.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://strapi2front.dev/logo-dark.svg">
      <img alt="strapi2front logo" src="https://strapi2front.dev/logo-light.svg" height="128">
    </picture>
  </a> -->
  <h1>strapi2front</h1>

<a href="https://elevenestudio.com"><img alt="Made by Eleven Estudio" src="https://img.shields.io/badge/MADE%20BY%20Eleven%20Estudio-000000.svg?style=for-the-badge&labelColor=000"></a>
<a href="https://www.npmjs.com/package/strapi2front"><img alt="NPM version" src="https://img.shields.io/npm/v/strapi2front.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/Eleven-Estudio/strapi2front/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/strapi2front.svg?style=for-the-badge&labelColor=000000"></a>

</div>

## The Strapi TypeScript Generator

`strapi2front` is a CLI tool that generates TypeScript types, services, Zod schemas, and Astro Actions from your Strapi CMS schema. One command syncs everything, keeping your frontend perfectly typed.

## Getting Started

Initialize strapi2front in your project:

```bash
npx strapi2front@latest init
```

Then sync your types whenever your Strapi schema changes:

```bash
npx strapi2front sync
```

## Features

- **Type Generation** - Auto-generate TypeScript interfaces from your Strapi schema
- **Service Generation** - Create typed service functions with full CRUD operations
- **Zod Schemas** - Generate validation schemas for forms (React Hook Form, TanStack Form, etc.)
- **Astro Actions** - Generate type-safe Astro Actions for client/server data fetching
- **File Upload** - Upload helpers for Astro Actions and browser-side uploads
- **JSDoc Support** - Generate JavaScript files with JSDoc annotations (no TypeScript required)
- **Smart Detection** - Automatically detects framework, TypeScript, and package manager
- **Strapi v4 & v5** - Full support for both Strapi versions
- **By-Feature Structure** - Organize generated code by feature (screaming architecture)

## Generated Output

```
src/strapi/
├── collections/
│   └── article/
│       ├── types.ts      # TypeScript interfaces
│       ├── schemas.ts    # Zod validation schemas
│       ├── service.ts    # Data fetching functions
│       └── actions.ts    # Astro Actions
├── singles/
│   └── homepage/
│       ├── types.ts
│       ├── schemas.ts
│       └── service.ts
├── components/
│   └── seo.ts
└── shared/
    ├── utils.ts          # Utility types
    ├── client.ts         # Strapi client
    ├── locales.ts        # i18n support
    ├── upload-action.ts  # Upload via Astro Action
    └── upload-client.ts  # Browser-side uploads
```

## Requirements

- Node.js 18+
- Strapi v4 or v5
- Astro 4+ (for Astro Actions, services work with any framework)

---

## Quick Setup

### 1. Create Strapi API Tokens

strapi2front uses **two separate tokens** for different purposes:

**Sync Token** (development only) - For fetching your schema:

1. Go to **Strapi Admin** → **Settings** → **API Tokens**
2. Create a new **Custom** token named "strapi2front sync"
3. Enable these permissions:
   - **Content-type-builder**: `getComponents`, `getComponent`, `getContentTypes`, `getContentType`
   - **I18n** (optional): `listLocales`

**Frontend Token** (production) - For your app's API calls:

1. Create another **Custom** token named "Frontend"
2. Grant only the permissions your frontend needs (e.g., `find`, `findOne` for your content types)

### 2. Configure Environment Variables

```bash
# .env
STRAPI_URL=http://localhost:1337

# Sync token (development only - do NOT deploy)
STRAPI_SYNC_TOKEN=your-sync-token

# Frontend token (production)
STRAPI_TOKEN=your-frontend-token
```

> **Tip:** When starting out, you can use just `STRAPI_TOKEN` for both sync and frontend. The config uses `STRAPI_SYNC_TOKEN || STRAPI_TOKEN` as fallback.

### 3. Initialize

```bash
npx strapi2front@latest init
```

### 4. Sync Types

```bash
npx strapi2front sync
```

---

## Configuration

After init, a `strapi.config.ts` is created:

```typescript
import { defineConfig } from "strapi2front";

export default defineConfig({
  url: process.env.STRAPI_URL || "http://localhost:1337",
  token: process.env.STRAPI_SYNC_TOKEN || process.env.STRAPI_TOKEN,
  strapiVersion: "v5",
  apiPrefix: "/api",
  output: {
    path: "src/strapi",
  },
  features: {
    types: true,
    services: true,
    schemas: true,
    actions: true,
    upload: false,
  },
});
```

### Key Options

| Option | Description |
|--------|-------------|
| `url` | Your Strapi instance URL |
| `token` | API token for syncing schema |
| `strapiVersion` | `"v4"` or `"v5"` |
| `apiPrefix` | API prefix (default: `/api`) |
| `outputFormat` | `"typescript"` or `"jsdoc"` |
| `output.path` | Where to generate files |

### Features

| Feature | Description |
|---------|-------------|
| `types` | TypeScript interfaces for all content types |
| `services` | API service functions with CRUD operations |
| `schemas` | Zod validation schemas for forms |
| `actions` | Astro Actions (TypeScript only) |
| `upload` | File upload helpers |

---

## CLI Commands

```bash
# Initialize project
npx strapi2front init

# Sync all features
npx strapi2front sync

# Sync specific features
npx strapi2front sync --types-only
npx strapi2front sync --services-only
npx strapi2front sync --schemas-only
npx strapi2front sync --actions-only
npx strapi2front sync --upload-only
```

---

## Framework Support

| Framework | Types | Services | Schemas | Actions |
|-----------|-------|----------|---------|---------|
| Astro 4+  | ✅    | ✅       | ✅      | ✅      |
| Next.js   | ✅    | ✅       | ✅      | 🔜 Soon |
| Nuxt      | ✅    | ✅       | ✅      | 🔜 Soon |
| Other     | ✅    | ✅       | ✅      | ❌      |

---

## Documentation

For complete documentation, guides, and examples, visit the [documentation site](https://github.com/eleven-estudio/strapi2front#readme).

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## Security

If you believe you have found a security vulnerability, please report it to [hello@elevenestudio.com](mailto:hello@elevenestudio.com).

## License

MIT - see [LICENSE](../../LICENSE) for details.

## Disclaimer

This is a community project and is not affiliated with, endorsed by, or officially connected to [Strapi](https://strapi.io). The name "Strapi" is used solely to indicate compatibility with the Strapi CMS.

---

<div align="center">
  Made with ❤️ by <a href="https://elevenestudio.com">Eleven Estudio</a>
</div>
