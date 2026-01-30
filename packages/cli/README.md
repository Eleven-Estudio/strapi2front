<div align="center">
  <a href="https://strapi2front.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://strapi2front.dev/logo-dark.svg">
      <img alt="strapi2front logo" src="https://strapi2front.dev/logo-light.svg" height="128">
    </picture>
  </a>
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
- Astro 4+ (more frameworks coming soon)

## Learn more

⊹ Visit [strapi2front.dev](https://strapi2front.dev) to learn more about the project.\
⊹ Visit [strapi2front.dev/docs](https://strapi2front.dev/docs) to view the full documentation.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Security

If you believe you have found a security vulnerability, we encourage you to let us know right away.

Please report any issues to [hello@elevenestudio.com](mailto:hello@elevenestudio.com).

## License

MIT - see [LICENSE](LICENSE) for details.

## Disclaimer

This is a community project and is not affiliated with, endorsed by, or officially connected to [Strapi](https://strapi.io). The name "Strapi" is used solely to indicate compatibility with the Strapi CMS.

---

<div align="center">
  Made with ❤️ by <a href="https://elevenestudio.com">Eleven Estudio</a>
</div>
