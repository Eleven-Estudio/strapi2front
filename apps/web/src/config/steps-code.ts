export const setupOutput = `
  ◇ Project configuration detected
  ┌ strapi2front setup
  │
  ◇  Detected Configuration ─────╮
  │                              │
  │  Framework: Astro v^5.16.15  │
  │  TypeScript: enabled         │
  │  Package Manager: pnpm       │
  │                              │
  ├──────────────────────────────╯
  │
  ◇ What is your Strapi URL?
  │ http://localhost:1337
  │
  ◇ What is your Strapi API token?
  │ YOUR API TOKEN
  │
  ◇ What version of Strapi are you using?
  │ Strapi v5
  │
  ◇ Where should we generate the Strapi files?
  │ src/strapi
  │
  ◇ What would you like to generate?
  │ Types, Services, Astro Actions
  │
  ◇ Detected Configuration
  │ Framework: Astro v5.16.15
  │ TypeScript: enabled
  │ Package Manager: pnpm
  │
  ◇ Setup complete!
  │ v Created strapi.config.ts
  │ v Updated .env with Strapi credentials
  │
  │ Next steps:
  │  1. Run npx strapi2front sync to generate types
  │  2. Import types from src/strapi/types
  │  3. Import services from src/strapi/services
  │
  └ Happy Coding!`;

export const configCode = `
import { defineConfig } from "strapi2front";

export default defineConfig({
  url: process.env.STRAPI_URL || "http://localhost:1337",
  token: process.env.STRAPI_TOKEN,
  output: {
    path: "src/strapi",
    types: "types",
    services: "services",
    actions: "actions/strapi",
    structure: "by-feature"
  },
  features: {
    types: true,
    services: true,
    actions: true,
  },
  strapiVersion: "v5",
});`;

export const syncOutput = `
  ◇  Configuration loaded
  │
  ◇  Version detection complete
  │
  ●  Strapi v5
  │
  ◇  Schema fetched: 3 collections, 1 single, 4 components
  │
  ◇  Generated 18 files
  │
  ◇  Sync complete! ──────────────────────────────╮
  │                                               │
  │  Generated 18 files in src/strapi             │
  │  Files generated:                             │
  │    src/strapi/shared/utils.ts                 │
  │    src/strapi/shared/client.ts                │
  │    src/strapi/shared/locales.ts               │
  │    src/strapi/collections/article/types.ts    │
  │    src/strapi/collections/article/service.ts  │
  │    src/strapi/collections/article/actions.ts  │
  │    src/strapi/collections/category/types.ts   │
  │    src/strapi/collections/category/service.ts │
  │    src/strapi/collections/category/actions.ts │
  │    src/strapi/collections/author/types.ts     │
  │    ... and 8 more                             │
  │                                               │
  ├───────────────────────────────────────────────╯
  │
  └ Types and services are ready to use!`;

export const useCode = `
---
// Server Component: Use services directly
import Layout from "../layouts/Layout.astro";
import { articleService } from "../strapi/collections/article/service";
import type { Article } from "../strapi/collections/article/types";

const { data: articles } = await articleService.find({
  populate: ["cover", "author"],
  sort: ["publishedAt:desc"],
});
---

<Layout title="Blog">
  {articles.map((article: Article) => (
    <article>
      <img src={article.cover?.url} alt={article.title} />
      <h2>{article.title}</h2>
      <span>By {article.author?.name}</span>
    </article>
  ))}
</Layout>

<script>
  // Client Component: Use Astro Actions
  import { actions } from "astro:actions";

  const { data, error } = await actions.strapi.article.find({
    populate: ["cover", "author"],
    filters: { featured: { $eq: true } },
  });
</script>
`;
