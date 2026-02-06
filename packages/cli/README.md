# strapi2front

<a href="https://elevenestudio.com"><img alt="Made by Eleven Estudio" src="https://img.shields.io/badge/MADE%20BY%20Eleven%20Estudio-000000.svg?style=for-the-badge&labelColor=000"></a>
<a href="https://www.npmjs.com/package/strapi2front"><img alt="NPM version" src="https://img.shields.io/npm/v/strapi2front.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/Eleven-Estudio/strapi2front/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/strapi2front.svg?style=for-the-badge&labelColor=000000"></a>


Generate TypeScript types, services, Zod schemas, and Astro Actions from your Strapi schema.

**[View Documentation →](https://strapi2front.elevenestudio.com/docs)**

---

## Quick Start

```bash
npx strapi2front@latest init
npx strapi2front sync
```

## Features

- **Type Generation** — TypeScript interfaces from your Strapi schema
- **Service Generation** — Typed CRUD functions for all content types
- **Zod Schemas** — Validation schemas for forms
- **Astro Actions** — Type-safe server actions
- **File Upload** — Upload helpers for Astro and browser
- **JSDoc Support** — JavaScript files with JSDoc annotations (no TypeScript required)
- **Strapi v4 & v5** — Full support for both versions
- **By-Feature Structure** — Organize generated code by feature (screaming architecture)

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
    └── upload-action.ts  # File upload helpers
```

## Framework Support


| Framework      | Types | Services | Schemas | Actions |
| -------------- | ----- | -------- | ------- | ------- |
| Astro 4+       | ✅     | ✅        | ✅       | ✅       |
| Next.js        | ✅     | ✅        | ✅       | 🔜      |
| Nuxt           | ✅     | ✅        | ✅       | 🔜      |
| SvelteKit      | ✅     | ✅        | ✅       | 🔜      |
| TanStack Start | ✅     | ✅        | ✅       | 🔜      |


> Types, Services, and Schemas work with any framework. Actions are framework-specific and more are coming soon.

## Requirements

- Node.js 18+
- Strapi v4 or v5

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Eleven Estudio](https://elevenestudio.com)

---

Made with ❤️ by [Eleven Estudio](https://elevenestudio.com)