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

`strapi2front` is a CLI tool that generates TypeScript types, services, and Astro Actions from your Strapi CMS schema. One command syncs everything, keeping your frontend perfectly typed.

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

⊹ **Type Generation** - Auto-generate TypeScript interfaces from your Strapi schema\
⊹ **Service Generation** - Create typed service functions for all content types\
⊹ **Astro Actions** - Generate type-safe Astro Actions for client/server data fetching\
⊹ **JSDoc Support** - Generate JavaScript files with JSDoc annotations (no TypeScript required)\
⊹ **Smart Detection** - Automatically detects framework, TypeScript, and package manager\
⊹ **Strapi v4 & v5** - Full support for both Strapi versions\
⊹ **By-Feature Structure** - Organize generated code by feature (screaming architecture)

## Generated Output

```
src/strapi/
├── collections/
│   └── article/
│       ├── types.ts      # TypeScript interfaces
│       ├── service.ts    # Data fetching functions
│       └── actions.ts    # Astro Actions
├── singles/
│   └── homepage/
│       ├── types.ts
│       └── service.ts
├── components/
│   └── seo.ts
└── shared/
    ├── utils.ts          # Utility types
    ├── client.ts         # Strapi client
    └── locales.ts        # i18n support
```

## Requirements

- Node.js 18+
- Strapi v4 or v5
- Astro 4+ (for Astro Actions, more frameworks coming soon)

---

## Documentation

### Creating a Strapi API Token

To generate types from your Strapi schema, you need to create an API token with specific permissions.

#### Step 1: Create a new API Token

1. Go to your **Strapi Admin Panel**
2. Navigate to **Settings** → **API Tokens**
3. Click **Create new API Token**
4. Give it a name (e.g., "strapi2front")
5. Set **Token type** to **Custom**

#### Step 2: Configure Permissions

The token needs **read-only access** to the Content-Type Builder plugin. Enable these permissions:

**Content-type-builder** (Required):
- `getComponents` - Read component schemas
- `getComponent` - Read individual component schema
- `getContentTypes` - Read content type schemas
- `getContentType` - Read individual content type schema

**I18n** (Optional, only if using localization):
- `listLocales` - List available locales

> **Note**: This token only reads your schema structure. It does NOT access your actual content data.

#### Step 3: Save the Token

1. Click **Save**
2. Copy the generated token
3. Add it to your `.env` file:

```env
STRAPI_TOKEN=your-token-here
```

---

### Configuration

After running `init`, a `strapi.config.ts` (or `.js`) file is created in your project root:

```typescript
import { defineConfig } from "strapi2front";

export default defineConfig({
  url: "http://localhost:1337",
  strapiVersion: "v5",
  apiPrefix: "/api",
  output: {
    path: "src/strapi",
  },
  features: {
    types: true,
    services: true,
    actions: true,
  },
});
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | - | Your Strapi instance URL |
| `token` | `string` | - | API token (recommended to use env variable) |
| `strapiVersion` | `"v4"` \| `"v5"` | `"v5"` | Your Strapi version |
| `apiPrefix` | `string` | `"/api"` | API prefix configured in Strapi |
| `outputFormat` | `"typescript"` \| `"jsdoc"` | `"typescript"` | Output format for generated files |
| `moduleType` | `"esm"` \| `"commonjs"` | auto-detected | Module system for JSDoc output |

#### Output Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `output.path` | `string` | `"src/strapi"` | Where to generate files |
| `output.structure` | `"by-feature"` \| `"by-layer"` | `"by-feature"` | Code organization structure |

#### Feature Flags

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `features.types` | `boolean` | `true` | Generate type definitions |
| `features.services` | `boolean` | `true` | Generate service functions |
| `features.actions` | `boolean` | `true` | Generate Astro Actions (Astro 4+ only) |

#### Advanced Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `options.includeDrafts` | `boolean` | `false` | Include draft content types |
| `options.strictTypes` | `boolean` | `false` | Generate strict types (no optional fields) |

---

### Environment Variables

You can configure strapi2front using environment variables:

```env
# Required
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=your-api-token

# Optional
STRAPI_API_PREFIX=/api
```

Environment variables take precedence over config file values. This is useful for:
- Keeping tokens out of version control
- Different configurations per environment (dev/staging/production)

---

### Output Formats

#### TypeScript (Default)

Generates `.ts` files with full TypeScript interfaces:

```typescript
export interface Article {
  id: number;
  title: string;
  content: string;
  author?: Author;
}
```

#### JSDoc (JavaScript)

For projects without TypeScript, generates `.js` files with JSDoc annotations:

```javascript
/**
 * @typedef {Object} Article
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * @property {Author} [author]
 */
```

The module type (ESM vs CommonJS) is auto-detected from your `package.json` "type" field.

---

### Framework Support

| Framework | Types | Services | Actions |
|-----------|-------|----------|---------|
| Astro 4+  | ✅    | ✅       | ✅      |
| Astro < 4 | ✅    | ✅       | ❌      |
| Next.js   | ✅    | ✅       | 🔜 Soon |
| Nuxt      | ✅    | ✅       | 🔜 Soon |
| Other     | ✅    | ✅       | ❌      |

---

### Troubleshooting

#### "Token is required" error

Make sure your token is set either in:
- `.env` file as `STRAPI_TOKEN=...`
- Config file as `token: "..."`

#### "Failed to fetch content types" error

1. Verify your Strapi instance is running
2. Check that the URL is correct (including protocol)
3. Ensure your token has the required permissions (see [Creating a Strapi API Token](#creating-a-strapi-api-token))

#### Generated types are outdated

Run `npx strapi2front sync` after any schema changes in Strapi.

#### Custom API prefix not working

If your Strapi uses a custom API prefix (not `/api`), set it in your config:

```typescript
export default defineConfig({
  apiPrefix: "/custom-prefix",
});
```

Or use the environment variable:

```env
STRAPI_API_PREFIX=/custom-prefix
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Security

If you believe you have found a security vulnerability, we encourage you to let us know right away.

Please report any issues to [support@elevenestudio.com](mailto:support@elevenestudio.com).

## License

MIT - see [LICENSE](LICENSE) for details.

## Disclaimer

This is a community project and is not affiliated with, endorsed by, or officially connected to [Strapi](https://strapi.io). The name "Strapi" is used solely to indicate compatibility with the Strapi CMS.

---

<div align="center">
  Made with ❤️ by <a href="https://elevenestudio.com">Eleven Estudio</a>
</div>
