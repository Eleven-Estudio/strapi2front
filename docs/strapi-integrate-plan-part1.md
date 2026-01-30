# Plan Estratégico: CLI Open Source para Integración de Strapi CMS

## PARTE 1 de 3

**Proyecto:** `strapi-integrate` / `strapi-sync` / `create-strapi-client`

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Autor:** Geovanny  

---

## 📋 Tabla de Contenidos

### Parte 1 (Este Documento)

1. [Investigación Preliminar](#investigación-preliminar)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estrategia Framework-Specific](#estrategia-framework-specific)
5. [Estrategia de Integración](#estrategia-de-integración)
6. [Cliente Strapi](#cliente-strapi)
7. [Configuración Flexible](#configuración-flexible)
8. [Funcionalidades Core](#funcionalidades-core)

### Parte 2

9. Arquitectura de Generación de Código
2. Consideraciones Técnicas
3. Roadmap de Desarrollo
4. Referencias

### Parte 3

13. Cosas No Previstas
2. Decisiones de Diseño
3. Próximos Pasos
4. Opinión y Recomendaciones

---

## 🔍 1. Investigación Preliminar Recomendada

### Proyectos Similares a Analizar

#### CLIs de Integración CMS Existentes

**`@nuxt/content`** - Manejo de contenido en Nuxt

- **Estudiar:** Sistema de auto-import, type generation
- **Link:** <https://content.nuxt.com/>
- **Por qué es relevante:** Excelente integración con framework, auto-imports

**`gatsby-source-strapi`** - Integración específica pero limitada

- **Estudiar:** Cómo manejan el schema de Strapi
- **Link:** <https://www.gatsbyjs.com/plugins/gatsby-source-strapi/>
- **Limitación:** Solo para Gatsby, no portable

**`payload-cli`** - CLI de Payload CMS (competidor directo de Strapi)

- **Estudiar:** Developer experience, comandos disponibles
- **Link:** <https://payloadcms.com/docs/cli>
- **Por qué es relevante:** Similar dominio de problema

**`contentful-cli`** - Referencia de CLI robusto para CMS headless

- **Estudiar:** Manejo de migraciones, export/import
- **Link:** <https://github.com/contentful/contentful-cli>
- **Por qué es relevante:** CLI maduro, años de desarrollo

#### CLIs con Excelente DX a Estudiar

**`create-t3-app`** ⭐⭐⭐

- ✅ Detección de stack automática
- ✅ Opciones interactivas claras
- ✅ Instalación de dependencias automática
- **Link:** <https://github.com/t3-oss/create-t3-app>
- **Acción:** Clonar y analizar código fuente

**`@clack/prompts`** ⭐⭐⭐

- ✅ Sistema de prompts moderno y hermoso
- ✅ Usado por Astro, Svelte, y otros
- **Link:** <https://github.com/natemoo-re/clack>
- **Acción:** Usar para tus prompts interactivos

**`plop`**

- ✅ Generadores de código con templates
- ✅ Sistema de preguntas flexible
- **Link:** <https://plopjs.com/>
- **Aprender:** Sistema de templates

**`hygen`**

- ✅ Generador de código escalable
- ✅ Templates con EJS
- **Link:** <https://www.hygen.io/>
- **Aprender:** Estructura de generadores

#### Herramientas de Type Generation

**`openapi-typescript`** ⭐⭐⭐

- Generación de tipos desde OpenAPI specs
- **Link:** <https://github.com/drwpow/openapi-typescript>
- **Estudiar:** Algoritmo de generación de tipos

**`graphql-codegen`** ⭐⭐

- Inspiración para generación desde API
- **Link:** <https://the-guild.dev/graphql/codegen>
- **Estudiar:** Plugin system, templates

**`prisma`** ⭐⭐⭐

- Excelente sistema de sincronización y tipos
- **Comandos clave:** `prisma generate`, `prisma db pull`
- **Link:** <https://www.prisma.io/>
- **Estudiar:** Cómo manejan schema sync

---

## 🏗️ 2. Arquitectura del Proyecto

### Nombres Sugeridos

**Análisis de opciones:**

1. **`strapi-integrate`** ⭐ (RECOMENDADO)
   - ✅ Claro, describe lo que hace
   - ✅ Fácil de recordar
   - ✅ SEO friendly

2. `strapi-sync`
   - ⚠️ Implica solo sincronización
   - ⚠️ Menos descriptivo

3. `create-strapi-client`
   - ⚠️ Muy largo
   - ⚠️ Implica solo cliente, no integración completa

4. `strapi-connect`
   - ⚠️ Genérico

**Decisión:** `strapi-integrate`

### Estructura de Paquetes (Monorepo)

**Por qué monorepo:**

- Compartir código entre packages
- Versionado coordinado
- Desarrollo más fácil
- Testing integrado

```
strapi-integrate/
│
├── packages/
│   │
│   ├── cli/                                    # CLI principal
│   │   ├── src/
│   │   │   ├── commands/                       # Comandos del CLI
│   │   │   │   ├── init.ts                    # npx strapi-integrate init
│   │   │   │   ├── sync.ts                    # npx strapi-integrate sync
│   │   │   │   ├── add.ts                     # npx strapi-integrate add <feature>
│   │   │   │   ├── generate.ts                # npx strapi-integrate generate
│   │   │   │   ├── watch.ts                   # npx strapi-integrate watch
│   │   │   │   └── upgrade.ts                 # npx strapi-integrate upgrade
│   │   │   │
│   │   │   ├── detectors/                      # Detectores de proyecto
│   │   │   │   ├── framework.ts               # Detecta Astro/Next/Nuxt
│   │   │   │   ├── typescript.ts              # Detecta TS vs JS
│   │   │   │   └── package-manager.ts         # Detecta pnpm/npm/yarn/bun
│   │   │   │
│   │   │   ├── prompts/                        # Prompts interactivos
│   │   │   │   ├── init.prompts.ts
│   │   │   │   ├── connection.prompts.ts
│   │   │   │   └── features.prompts.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── file-system.ts
│   │   │   │   └── spinner.ts
│   │   │   │
│   │   │   └── index.ts                       # Entry point
│   │   │
│   │   ├── bin/
│   │   │   └── cli.js                         # Executable
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── core/                                   # Lógica de negocio
│   │   ├── src/
│   │   │   ├── schema/                         # Manejo de schema
│   │   │   │   ├── fetcher.ts                 # Fetch schema de Strapi
│   │   │   │   ├── parser.ts                  # Parse schema
│   │   │   │   ├── validator.ts               # Validar schema
│   │   │   │   └── differ.ts                  # Detectar cambios
│   │   │   │
│   │   │   ├── config/                         # Configuración
│   │   │   │   ├── loader.ts                  # Cargar strapi.config.ts
│   │   │   │   ├── schema.ts                  # Zod schema del config
│   │   │   │   └── defaults.ts                # Defaults
│   │   │   │
│   │   │   ├── plugin-system/                  # Sistema de plugins
│   │   │   │   ├── plugin.ts                  # Plugin API
│   │   │   │   ├── hooks.ts                   # Hooks system
│   │   │   │   └── registry.ts                # Plugin registry
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   └── package.json
│   │
│   ├── generators/                             # Generadores de código
│   │   ├── src/
│   │   │   ├── types/                          # Generador de tipos
│   │   │   │   ├── generator.ts
│   │   │   │   ├── templates/
│   │   │   │   │   ├── collection.hbs
│   │   │   │   │   ├── single.hbs
│   │   │   │   │   ├── component.hbs
│   │   │   │   │   └── utils.hbs
│   │   │   │   └── formatter.ts               # Prettier formatting
│   │   │   │
│   │   │   ├── services/                       # Generador de servicios
│   │   │   │   ├── generator.ts
│   │   │   │   ├── templates/
│   │   │   │   │   ├── service.hbs
│   │   │   │   │   └── index.hbs
│   │   │   │   └── methods.ts                 # CRUD methods
│   │   │   │
│   │   │   ├── actions/                        # Generador de Actions (Astro/Next)
│   │   │   │   ├── generator.ts
│   │   │   │   ├── templates/
│   │   │   │   │   ├── astro-actions.hbs
│   │   │   │   │   └── next-actions.hbs
│   │   │   │   └── validation.ts              # Zod schemas
│   │   │   │
│   │   │   ├── api-routes/                     # Generador de API Routes
│   │   │   │   ├── generator.ts
│   │   │   │   └── templates/
│   │   │   │       ├── astro-route.hbs
│   │   │   │       └── next-route.hbs
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   └── package.json
│   │
│   ├── client/                                 # Wrapper del Strapi SDK
│   │   ├── src/
│   │   │   ├── client.ts                      # Cliente principal
│   │   │   ├── query-builder.ts               # Query builder tipado
│   │   │   ├── request.ts                     # HTTP layer
│   │   │   ├── auth.ts                        # Authentication
│   │   │   ├── types.ts                       # Tipos base
│   │   │   └── index.ts
│   │   │
│   │   └── package.json
│   │
│   ├── adapters/                               # Adaptadores por framework
│   │   ├── astro/
│   │   │   ├── src/
│   │   │   │   ├── adapter.ts                 # Adapter principal
│   │   │   │   ├── actions.ts                 # Astro Actions generator
│   │   │   │   ├── api-routes.ts              # API Routes generator
│   │   │   │   └── utils.ts
│   │   │   └── package.json
│   │   │
│   │   ├── next/
│   │   │   ├── src/
│   │   │   │   ├── adapter.ts
│   │   │   │   ├── server-actions.ts          # Next.js Server Actions
│   │   │   │   ├── api-routes.ts              # Next.js API Routes
│   │   │   │   └── utils.ts
│   │   │   └── package.json
│   │   │
│   │   ├── nuxt/
│   │   └── sveltekit/
│   │
│   ├── integrations/                           # Framework integrations/plugins
│   │   ├── astro-integration/
│   │   │   ├── src/
│   │   │   │   ├── integration.ts             # Astro Integration API
│   │   │   │   ├── hooks.ts                   # Build/dev hooks
│   │   │   │   ├── dev-server.ts              # Dev mode watcher
│   │   │   │   ├── vite-plugin.ts             # Vite plugin interno
│   │   │   │   └── index.ts
│   │   │   └── package.json
│   │   │
│   │   ├── next-plugin/
│   │   │   ├── src/
│   │   │   │   ├── plugin.ts                  # Next.js plugin
│   │   │   │   └── webpack-plugin.ts
│   │   │   └── package.json
│   │   │
│   │   └── vite-plugin/
│   │       ├── src/
│   │       │   └── plugin.ts                  # Generic Vite plugin
│   │       └── package.json
│   │
│   ├── types/                                  # Utilidades de tipado
│   │   ├── src/
│   │   │   ├── strapi.ts                      # Tipos de Strapi
│   │   │   ├── config.ts                      # Tipos del config
│   │   │   ├── plugin.ts                      # Tipos de plugins
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── testing-utils/                          # Utilidades para tests
│       ├── src/
│       │   ├── fixtures/                       # Fixtures de prueba
│       │   │   ├── strapi-schemas/
│       │   │   └── projects/
│       │   ├── mocks/                          # Mocks
│       │   │   ├── strapi-api.ts
│       │   │   └── file-system.ts
│       │   └── helpers.ts                      # Test helpers
│       └── package.json
│
├── examples/                                   # Proyectos ejemplo
│   ├── astro-actions/                          # Ejemplo con Actions
│   │   ├── src/
│   │   ├── astro.config.mjs
│   │   ├── strapi.config.ts
│   │   └── package.json
│   │
│   ├── astro-api-routes/                       # Ejemplo con API Routes
│   ├── next-server-actions/                    # Ejemplo Next.js
│   └── nuxt-composables/                       # Ejemplo Nuxt
│
├── docs/                                       # Documentación
│   ├── getting-started.md
│   ├── configuration.md
│   ├── api-reference.md
│   │
│   ├── guides/                                 # Guías por framework
│   │   ├── astro.md
│   │   ├── nextjs.md
│   │   ├── nuxt.md
│   │   └── custom-plugins.md
│   │
│   ├── adr/                                    # Architecture Decision Records
│   │   ├── 001-monorepo.md
│   │   ├── 002-strapi-sdk-wrapper.md
│   │   ├── 003-plugin-system.md
│   │   └── 004-actions-vs-api-routes.md
│   │
│   └── migration-guides/                       # Guías de migración
│       └── v1-to-v2.md
│
├── templates/                                  # Templates base para generación
│   ├── types/
│   │   ├── collection.hbs
│   │   ├── single.hbs
│   │   └── component.hbs
│   ├── services/
│   │   └── service.hbs
│   ├── actions/
│   │   ├── astro.hbs
│   │   └── next.hbs
│   └── config/
│       └── strapi.config.hbs
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                              # CI/CD
│   │   ├── release.yml                         # Releases automáticos
│   │   └── docs.yml                            # Deploy docs
│   │
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── question.md
│   │
│   └── PULL_REQUEST_TEMPLATE.md
│
├── package.json                                # Root package.json
├── pnpm-workspace.yaml                         # PNPM workspaces
├── turbo.json                                  # Turborepo config
├── tsconfig.json                               # TypeScript config base
├── .changeset/                                 # Changesets para versioning
├── README.md                                   # README principal
├── CONTRIBUTING.md                             # Guía de contribución
├── CODE_OF_CONDUCT.md                          # Código de conducta
└── LICENSE                                     # MIT License
```

### Decisiones Arquitectónicas Clave

**1. Monorepo con pnpm + turborepo**

- ✅ Compartir código fácilmente
- ✅ Build incremental
- ✅ Caching efectivo
- ✅ Desarrollo coordinado

**2. Separation of Concerns**

- `cli` - Solo interfaz de usuario
- `core` - Lógica de negocio reutilizable
- `generators` - Generación de código aislada
- `adapters` - Framework-specific logic

**3. Plugin Architecture**

- Core mínimo
- Features como plugins
- Extensible por comunidad

---

## 🛠️ 3. Stack Tecnológico Recomendado

### Core CLI

#### Parsing de Comandos

**Commander.js** ⭐ (RECOMENDADO)

```typescript
// Ejemplo de uso
program
  .command('init')
  .description('Initialize Strapi integration')
  .option('-f, --force', 'Force overwrite')
  .action(async (options) => {
    await initCommand(options);
  });
```

**Pros:**

- ✅ Maduro, bien documentado
- ✅ Usado ampliamente (npm, Vue CLI, etc)
- ✅ Excelente manejo de sub-comandos
- ✅ Auto-generación de help

**Contras:**

- ⚠️ Un poco verboso
- ⚠️ API menos moderna

**Link:** <https://github.com/tj/commander.js>

**Alternativa: CAC**

```typescript
// Más ligero y moderno
cli
  .command('init', 'Initialize integration')
  .option('--force', 'Force overwrite')
  .action(async (options) => {
    await initCommand(options);
  });
```

**Decisión:** Commander.js por estabilidad y features

#### Prompts Interactivos

**@clack/prompts** ⭐⭐⭐ (RECOMENDADO)

```typescript
import * as p from '@clack/prompts';

const answers = await p.group({
  framework: () => p.select({
    message: 'Select your framework',
    options: [
      { value: 'astro', label: 'Astro' },
      { value: 'next', label: 'Next.js' },
    ]
  }),
  
  typescript: () => p.confirm({
    message: 'Use TypeScript?',
    initialValue: true
  })
});
```

**Pros:**

- ✅ Hermoso diseño moderno
- ✅ Excelente UX
- ✅ Usado por Astro, Svelte
- ✅ Grupos de preguntas
- ✅ Estados de loading

**Link:** <https://github.com/natemoo-re/clack>

**Alternativa: inquirer**

- Más maduro, menos bonito
- API más tradicional

**Decisión:** @clack/prompts por mejor UX

#### Utilidades de Terminal

**picocolors** - Colores (más ligero que chalk)

```typescript
import pc from 'picocolors';
console.log(pc.green('✓ Success!'));
```

**ora** - Spinners de carga

```typescript
import ora from 'ora';
const spinner = ora('Loading...').start();
spinner.succeed('Done!');
```

**execa** - Ejecución de comandos shell

```typescript
import { execa } from 'execa';
await execa('pnpm', ['install']);
```

**consola** - Logger unificado

```typescript
import consola from 'consola';
consola.info('Information');
consola.error('Error occurred');
```

### Detección y Análisis

**jiti** - Cargar configs TypeScript/ESM

```typescript
import { createJiti } from 'jiti';
const jiti = createJiti(import.meta.url);
const config = jiti('./strapi.config.ts');
```

**detect-package-manager** - Detectar pnpm/npm/yarn/bun

```typescript
import { detect } from 'detect-package-manager';
const pm = await detect(); // 'pnpm' | 'npm' | 'yarn' | 'bun'
```

**pkg-types** - Leer package.json tipado

```typescript
import { readPackageJSON } from 'pkg-types';
const pkg = await readPackageJSON();
```

**fast-glob** - Buscar archivos eficientemente

```typescript
import fg from 'fast-glob';
const files = await fg(['src/**/*.ts']);
```

### Generación de Código

#### Templating

**handlebars** ⭐ (RECOMENDADO)

```handlebars
{{!-- templates/service.hbs --}}
export const {{camelCase name}}Service = {
  async findMany() {
    return await strapi.{{pluralize name}}.findMany();
  }
};
```

**Pros:**

- ✅ Lógica separada de vista
- ✅ Helpers custom
- ✅ Muy flexible

**ejs** (Alternativa)

```ejs
export const <%= camelCase(name) %>Service = {
  async findMany() {
    return await strapi.<%= pluralize(name) %>.findMany();
  }
};
```

**Decisión:** Handlebars por mejor separación

#### Formateo

**prettier** - ESENCIAL

```typescript
import prettier from 'prettier';

const formatted = await prettier.format(code, {
  parser: 'typescript',
  semi: true,
  singleQuote: true,
});
```

#### AST Manipulation

**ts-morph** - Para modificar código existente

```typescript
import { Project } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath('astro.config.mjs');

// Modificar AST
sourceFile.addImportDeclaration({
  moduleSpecifier: '@strapi-integrate/astro',
  namedImports: ['strapiIntegration']
});

sourceFile.save();
```

### Cliente Strapi

**@strapi/sdk-plugin** ⭐⭐⭐ (BASE)

```typescript
import { Strapi } from '@strapi/sdk-plugin';

const strapi = new Strapi({
  url: 'https://api.example.com',
  auth: { token: 'xxx' }
});

const posts = await strapi.collection('posts').find();
```

**Tu wrapper agregará:**

- Type safety
- Query builder
- Helpers específicos

### Testing

**vitest** ⭐⭐⭐ (RECOMENDADO)

```typescript
import { describe, it, expect } from 'vitest';

describe('Framework Detector', () => {
  it('should detect Astro', async () => {
    const framework = await detectFramework('/path/to/project');
    expect(framework).toBe('astro');
  });
});
```

**Pros:**

- ✅ Muy rápido
- ✅ Compatible con Vite
- ✅ Hot module reload en tests
- ✅ Gran DX

**Complementos:**

- `@vitest/ui` - UI visual
- `execa` - Test CLI commands
- `memfs` - In-memory file system

### Build y Desarrollo

**tsup** ⭐ (RECOMENDADO)

```typescript
// tsup.config.ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
});
```

**turborepo** ⭐ (RECOMENDADO)

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "cache": false
    }
  }
}
```

**changesets** - Versioning

```bash
pnpm changeset
pnpm changeset version
pnpm changeset publish
```

**pnpm** - Package manager

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'examples/*'
```

### Documentación

**VitePress** ⭐

```typescript
// docs/.vitepress/config.ts
export default {
  title: 'Strapi Integrate',
  description: 'Integrate Strapi CMS easily',
  themeConfig: {
    nav: [...],
    sidebar: [...]
  }
}
```

---

## 🎯 4. Estrategia Framework-Specific Features

### El Dilema: Actions vs API Routes vs Direct Fetch

**Contexto Moderno:**

- Astro tiene **Actions** (type-safe, server-side)
- Next.js tiene **Server Actions** (similar)
- Son el futuro, pero API Routes siguen siendo válidos

### Astro: Tres Opciones

#### Opción 1: Astro Actions ⭐ (RECOMENDADO)

**Por qué es mejor:**

- ✅ Type-safe end-to-end
- ✅ Validación con Zod integrada
- ✅ Puede llamarse desde cliente y servidor
- ✅ Es el patrón moderno de Astro

**Código generado:**

```typescript
// src/actions/strapi/posts.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { postsService } from '../../strapi/services/posts.service';

export const posts = {
  getAll: defineAction({
    input: z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional(),
    handler: async (input) => {
      return await postsService.findMany({
        pagination: {
          limit: input?.limit || 10,
          start: input?.offset || 0,
        }
      });
    }
  }),
  
  getBySlug: defineAction({
    input: z.object({ slug: z.string() }),
    handler: async ({ slug }) => {
      return await postsService.findBySlug(slug);
    }
  })
};
```

**Uso en página:**

```astro
---
import { actions } from 'astro:actions';

const posts = await actions.posts.getAll({ limit: 5 });
---

<ul>
  {posts.map(post => <li>{post.title}</li>)}
</ul>
```

**Uso desde cliente:**

```typescript
// Frontend JavaScript
import { actions } from 'astro:actions';

button.addEventListener('click', async () => {
  const post = await actions.posts.getBySlug({ slug: 'hello-world' });
  console.log(post);
});
```

#### Opción 2: API Routes (Tradicional)

**Cuándo usar:**

- Proyectos legacy
- Necesitas endpoints REST públicos
- Integración con servicios externos

**Código generado:**

```typescript
// src/pages/api/posts/index.ts
import type { APIRoute } from 'astro';
import { postsService } from '../../../strapi/services/posts.service';

export const GET: APIRoute = async ({ url }) => {
  const limit = url.searchParams.get('limit');
  const offset = url.searchParams.get('offset');
  
  const posts = await postsService.findMany({
    pagination: {
      limit: limit ? parseInt(limit) : 10,
      start: offset ? parseInt(offset) : 0,
    }
  });
  
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Uso:**

```typescript
const response = await fetch('/api/posts?limit=5');
const posts = await response.json();
```

#### Opción 3: Direct Fetch (Solo SSR/SSG)

**Cuándo usar:**

- Solo contenido estático
- No necesitas interacciones del cliente
- Blogs, documentación

**Código generado:**

```typescript
// src/strapi/services/posts.service.ts
export const postsService = {
  async findMany(options) {
    return await strapi.posts.findMany(options);
  }
};
```

**Uso en página:**

```astro
---
import { postsService } from '../strapi/services/posts.service';
const posts = await postsService.findMany({ pagination: { limit: 10 } });
---

<ul>
  {posts.map(post => <li>{post.title}</li>)}
</ul>
```

### Prompt Durante Init

```bash
? How do you want to fetch data from Strapi?
  
  ❯ Astro Actions (recommended)
    • Type-safe end-to-end
    • Works from client and server
    • Modern Astro pattern
  
  ○ API Routes
    • Traditional REST endpoints  
    • Public API access
    • Good for external integrations
  
  ○ Direct fetch (SSR/SSG only)
    • Simplest approach
    • Only for static content
    • No client-side fetching
  
  ○ Hybrid (all of the above)
    • Maximum flexibility
    • Use the right tool for each case
    • Generates more files
```

### Next.js: Similar Estrategia

```bash
? What Next.js features do you want to use?
  
  ❯ Server Actions (App Router)
    • Type-safe
    • Modern Next.js pattern
    • Works with React Server Components
  
  ○ API Routes (Pages Router)
    • Traditional approach
    • Compatible with Pages Router
    • Public API endpoints
  
  ○ Server Components (direct fetch)
    • Simplest for static content
    • No API layer needed
  
  ○ All of the above
    • Maximum flexibility
```

### Tabla Comparativa

| Enfoque | Type Safety | Cliente | Servidor | Complejidad | Moderno | Use Case |
|---------|-------------|---------|----------|-------------|---------|----------|
| **Actions** | ✅✅✅ | ✅ | ✅ | Media | ✅ | Aplicaciones interactivas |
| **API Routes** | ⚠️ | ✅ | ✅ | Alta | ⚠️ | APIs públicas, legacy |
| **Direct Fetch** | ✅✅ | ❌ | ✅ | Baja | ✅ | Contenido estático |
| **Hybrid** | ✅✅ | ✅ | ✅ | Alta | ✅ | Apps grandes, múltiples casos |

### Recomendación por Escenario

**Blog estático → Direct Fetch**

- Solo SSG
- No interacciones
- Más simple

**SaaS / Dashboard → Actions**

- Interacciones del cliente
- Type safety crítico
- Validación

**API pública + Frontend → API Routes + Actions**

- Hybrid approach
- API para terceros
- Actions para tu frontend

**eCommerce → Actions + Direct Fetch**

- Actions para carrito, checkout
- Direct Fetch para páginas de producto (SSG)

---

## 🔌 5. Estrategia de Integración: CLI + Plugin

### La Gran Decisión: CLI Solo vs Plugin Solo vs Ambos

**Análisis:**

#### CLI Solo

```bash
# Usuario ejecuta manualmente
npx strapi-integrate sync
```

**Pros:**

- ✅ Funciona en cualquier proyecto
- ✅ Control total del usuario
- ✅ No depende del framework
- ✅ Portable

**Contras:**

- ❌ Requiere ejecución manual
- ❌ No se integra con build process
- ❌ Sin auto-sync
- ❌ Más fricción para el usuario

#### Plugin/Integration Solo

```typescript
// astro.config.mjs
export default defineConfig({
  integrations: [strapiIntegration({ ... })]
});
```

**Pros:**

- ✅ Auto-sync automático
- ✅ Mejor DX
- ✅ Configuración centralizada
- ✅ Integración profunda con build

**Contras:**

- ❌ Depende del framework
- ❌ Menos portable
- ❌ Más "mágico" (harder to debug)
- ❌ No funciona sin el framework

#### Enfoque Dual: CLI + Plugin ⭐ (RECOMENDADO)

**Por qué es superior:**

- ✅ Setup rápido con CLI
- ✅ Runtime óptimo con plugin
- ✅ Usuario elige nivel de automatización
- ✅ Funciona en más escenarios
- ✅ Best of both worlds

### Flujo de Trabajo Recomendado

```bash
# 1. Setup inicial con CLI
npx strapi-integrate init

┌ Strapi Integrate
│
◆ Detected: Astro 4.0.1
│
◆ Install Astro Integration for auto-sync?
│ ❯ Yes (recommended, automatic sync)
│ ○ No (manual CLI only)
└

# 2a. Si "Yes": astro.config.mjs se modifica automáticamente
# 2b. Si "No": usuario usa CLI manualmente
```

### Implementación del Doble Enfoque

#### CLI (packages/cli)

**Responsabilidades:**

- ✅ Setup inicial (`init`)
- ✅ Generación manual (`sync`, `generate`)
- ✅ Comandos de utilidad (`add`, `upgrade`)
- ✅ Diagnóstico (`test connection`)

```typescript
// packages/cli/src/commands/init.ts
export async function initCommand() {
  // 1. Detectar proyecto
  const project = await detectProject();
  
  // 2. Prompts interactivos
  const answers = await runPrompts();
  
  // 3. Generar archivos
  await generateFiles(answers);
  
  // 4. Preguntar sobre integration
  const installIntegration = await p.confirm({
    message: 'Install Astro Integration for auto-sync?',
    initialValue: true
  });
  
  if (installIntegration) {
    await installAstroIntegration();
    await modifyAstroConfig();
  }
  
  // 5. Success message
  showSuccessMessage();
}
```

#### Plugin/Integration (packages/integrations/astro-integration)

**Responsabilidades:**

- ✅ Auto-sync en dev mode
- ✅ Build hooks (sync antes de build)
- ✅ Configuración centralizada
- ✅ Caching layer
- ✅ HMR integration

```typescript
// packages/integrations/astro-integration/src/integration.ts
import type { AstroIntegration } from 'astro';
import { syncSchema } from '@strapi-integrate/core';

export function strapiIntegration(userConfig: StrapiIntegrationConfig): AstroIntegration {
  return {
    name: 'strapi-integrate',
    
    hooks: {
      'astro:config:setup': async ({ config, command }) => {
        // Setup del integration
        
        if (command === 'dev' && userConfig.sync?.onDev === 'watch') {
          // Iniciar watcher en dev mode
          await startWatcher(userConfig);
        }
      },
      
      'astro:build:start': async () => {
        if (userConfig.sync?.onBuild) {
          // Sync antes del build
          await syncSchema(userConfig);
        }
      },
      
      'astro:server:setup': async ({ server }) => {
        // HMR cuando cambien archivos generados
        server.watcher.on('change', (file) => {
          if (file.includes('strapi/types')) {
            server.ws.send({ type: 'full-reload' });
          }
        });
      }
    }
  };
}
```

### Configuración del Integration

```typescript
// astro.config.mjs (generado por CLI)
import { defineConfig } from 'astro/config';
import { strapiIntegration } from '@strapi-integrate/astro';

export default defineConfig({
  integrations: [
    strapiIntegration({
      // Connection
      url: import.meta.env.STRAPI_URL,
      token: import.meta.env.STRAPI_TOKEN,
      
      // Features
      features: {
        actions: true,
        apiRoutes: false,
        types: true,
        devMode: true,
      },
      
      // Output
      output: {
        types: './src/types/strapi',
        actions: './src/actions/strapi',
        services: './src/services/strapi',
      },
      
      // Sync
      sync: {
        onBuild: true,        // Sync antes del build
        onDev: 'watch',       // 'watch' | 'manual' | false
        interval: 5000,       // Polling interval (ms)
      },
      
      // Cache
      cache: {
        enabled: true,
        ttl: 60,
        strategy: 'stale-while-revalidate',
      },
      
      // Transform
      transform: {
        images: true,
        richText: 'markdown',
      }
    })
  ]
});
```

### Comparación UX: Con y Sin Integration

#### Sin Integration (CLI Manual)

```bash
# Terminal 1: Dev server
pnpm dev

# Terminal 2: Manual sync cuando cambias Strapi
pnpm strapi-integrate sync

# Flujo:
# 1. Usuario cambia algo en Strapi
# 2. Usuario se acuerda de ejecutar sync
# 3. Código se regenera
# 4. Usuario refresca browser
```

**Fricción:** ⚠️⚠️⚠️ Alta

#### Con Integration (Auto-sync)

```bash
# Solo un terminal
pnpm dev

# Flujo:
# 1. Usuario cambia algo en Strapi
# 2. Integration detecta cambio automáticamente
# 3. Código se regenera
# 4. HMR actualiza browser automáticamente
```

**Fricción:** ✅ Mínima

---

## 📦 6. Cliente Strapi: Wrapper vs SDK Oficial

### Decisión Estratégica: Hybrid Wrapper

**Arquitectura:**

```
Tu Cliente Tipado (lo que construyes)
        ↓
@strapi/sdk-plugin (SDK oficial como base)
        ↓
    HTTP Layer
        ↓
  Strapi REST API
```

### Por Qué Usar SDK Oficial como Base

#### ✅ Ventajas

**1. Mantenimiento Compartido**

- Strapi mantiene el SDK actualizado
- Bug fixes automáticos del equipo oficial
- Compatibilidad garantizada con backend

**2. Features Built-in**

- Autenticación (JWT, API tokens)
- Request/response interceptors
- Error handling robusto
- Upload de archivos
- Retry logic
- Request batching

**3. Compatibilidad**

- Funciona con Strapi v4 y v5
- Soporte para REST y GraphQL
- Plugins de Strapi funcionan out-of-the-box

#### 🚀 Tu Valor Agregado

**1. Type Safety End-to-End**

```typescript
// ❌ Sin tu wrapper (any)
const posts = await strapi.find('posts'); 
// posts: any

// ✅ Con tu wrapper (typed)
const posts = await strapi.posts.findMany();
// posts: Post[]

// Auto-complete funciona
posts[0].title      // ✅ string
posts[0].author     // ✅ Author
posts[0].invalid    // ❌ TypeScript error
```

**2. Developer Experience Superior**

```typescript
// Builder pattern intuitivo
const posts = await strapi.posts
  .where('status', '$eq', 'published')
  .populate(['author', 'tags'])
  .sort('createdAt', 'desc')
  .limit(10)
  .find();

// Helpers específicos
const featured = await strapi.posts.findFeatured();
const recent = await strapi.posts.findRecent(10);
const byCategory = await strapi.posts.findByCategory('tech');
```

**3. Transformaciones Automáticas**

```typescript
const post = await strapi.posts.findOne('123');

// Auto-transformations:
// - post.content es markdown parseado (si configurado)
// - post.coverImage.url es URL completa con dominio
// - post.publishedAt es Date object (no string)
// - post.author está populated automáticamente
```

### Implementación del Wrapper

```typescript
// packages/client/src/client.ts

import { Strapi } from '@strapi/sdk-plugin';
import type { GeneratedTypes } from './types';

export interface StrapiConfig {
  url: string;
  token?: string;
  apiVersion?: string;
}

export class StrapiClient<T = GeneratedTypes> {
  private sdk: Strapi;
  
  constructor(config: StrapiConfig) {
    // Usar SDK oficial como base
    this.sdk = new Strapi({
      url: config.url,
      auth: {
        token: config.token
      },
      apiVersion: config.apiVersion || 'v4'
    });
  }
  
  // Wrapper con tipos generados para cada collection
  // Este código se auto-genera basado en el schema
  get posts() {
    return {
      findMany: async (params?: QueryParams) => {
        return this.sdk
          .collection<T['Post']>('posts')
          .find(params) as Promise<T['Post'][]>;
      },
      
      findOne: async (id: string, params?: QueryParams) => {
        return this.sdk
          .collection<T['Post']>('posts')
          .findOne(id, params) as Promise<T['Post']>;
      },
      
      create: async (data: Partial<T['Post']>) => {
        return this.sdk
          .collection<T['Post']>('posts')
          .create({ data });
      },
      
      update: async (id: string, data: Partial<T['Post']>) => {
        return this.sdk
          .collection<T['Post']>('posts')
          .update(id, { data });
      },
      
      delete: async (id: string) => {
        return this.sdk
          .collection<T['Post']>('posts')
          .delete(id);
      }
    };
  }
  
  // Auto-generated para cada content-type...
}
```

### Query Builder con Tipos

```typescript
// packages/client/src/query-builder.ts

export class QueryBuilder<T> {
  private params: QueryParams = {};
  
  where(field: keyof T, operator: string, value: any) {
    if (!this.params.filters) this.params.filters = {};
    this.params.filters[field as string] = { [operator]: value };
    return this;
  }
  
  populate(relations: Array<keyof T> | '*') {
    this.params.populate = relations as any;
    return this;
  }
  
  sort(field: keyof T, order: 'asc' | 'desc' = 'asc') {
    const sortStr = order === 'desc' ? `-${String(field)}` : String(field);
    this.params.sort = sortStr;
    return this;
  }
  
  limit(limit: number) {
    if (!this.params.pagination) this.params.pagination = {};
    this.params.pagination.limit = limit;
    return this;
  }
  
  offset(start: number) {
    if (!this.params.pagination) this.params.pagination = {};
    this.params.pagination.start = start;
    return this;
  }
  
  build(): QueryParams {
    return this.params;
  }
}

// Uso
const params = new QueryBuilder<Post>()
  .where('status', '$eq', 'published')
  .populate(['author', 'tags'])
  .sort('createdAt', 'desc')
  .limit(10)
  .build();

const posts = await strapi.posts.findMany(params);
```

---

## 🎨 7. Configuración Flexible y Extensible

### Sistema de Presets

**Concepto:** Configuraciones pre-hechas para casos comunes

```typescript
// strapi.config.ts
import { defineConfig, presets } from '@strapi-integrate/core';

export default defineConfig({
  // Usar preset como base
  preset: presets.blog(),
  
  // Override específicos
  features: {
    actions: true, // Override del preset
  }
});
```

#### Presets Disponibles

```typescript
// Preset para blog
presets.blog() = {
  features: {
    actions: true,
    apiRoutes: false,
    types: true,
    cache: true,
  },
  transform: {
    richText: 'markdown',
    images: true,
  },
  populate: {
    default: ['author', 'categories', 'tags'],
    depth: 2,
  }
}

// Preset para ecommerce
presets.ecommerce() = {
  features: {
    actions: true,
    cache: true,
    types: true,
  },
  transform: {
    images: true,
    prices: true,
  },
  populate: {
    default: ['images', 'variants', 'category'],
    depth: 3,
  }
}

// Preset para corporate/marketing
presets.corporate() = {
  features: {
    actions: false,
    apiRoutes: false,
    types: true,
    cache: true,
  },
  transform: {
    richText: 'html',
    images: true,
  }
}
```

#### Composición de Presets

```typescript
export default defineConfig({
  extends: [
    presets.blog(),
    {
      cache: {
        ttl: 120 // Override: 2 minutos en vez del default
      }
    }
  ]
});
```

### Plugin System

```typescript
// strapi.config.ts
import { defineConfig } from '@strapi-integrate/core';
import { cachePlugin } from '@strapi-integrate/plugin-cache';
import { i18nPlugin } from '@strapi-integrate/plugin-i18n';
import { imageOptimizationPlugin } from '@strapi-integrate/plugin-images';

export default defineConfig({
  plugins: [
    // Official plugins
    cachePlugin({
      strategy: 'redis',
      redis: {
        host: 'localhost',
        port: 6379
      },
      ttl: 3600
    }),
    
    i18nPlugin({
      defaultLocale: 'es',
      locales: ['es', 'en', 'fr'],
      fallback: true,
    }),
    
    imageOptimizationPlugin({
      formats: ['webp', 'avif'],
      sizes: [640, 768, 1024, 1920],
      quality: 80,
    }),
    
    // Custom plugin del usuario
    {
      name: 'my-custom-plugin',
      version: '1.0.0',
      
      hooks: {
        'schema:fetched': async (schema) => {
          console.log('Schema fetched');
          return schema;
        },
        
        'types:generated': async (files) => {
          console.log('Types generated');
          return files;
        }
      }
    }
  ]
});
```

### Configuración Completa de Ejemplo

```typescript
// strapi.config.ts
import { defineConfig, presets } from '@strapi-integrate/core';

export default defineConfig({
  // Connection
  url: process.env.STRAPI_URL || 'http://localhost:1337',
  token: process.env.STRAPI_TOKEN,
  apiVersion: 'v5',
  
  // Preset base
  preset: presets.blog(),
  
  // Features
  features: {
    actions: true,
    apiRoutes: false,
    types: true,
    services: true,
    cache: true,
    devMode: true,
  },
  
  // Output paths
  output: {
    types: './src/types/strapi',
    services: './src/services/strapi',
    actions: './src/actions/strapi',
    config: './src/strapi/config.ts',
  },
  
  // Naming conventions
  naming: {
    services: 'camelCase',
    types: 'PascalCase',
    files: 'kebab-case',
  },
  
  // TypeScript
  typescript: {
    mode: 'strict',
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
  },
  
  // Sync
  sync: {
    onBuild: true,
    onDev: 'watch',
    interval: 5000,
    debounce: 1000,
  },
  
  // Cache
  cache: {
    enabled: true,
    ttl: 60,
    strategy: 'stale-while-revalidate',
    store: 'memory',
  },
  
  // Transform
  transform: {
    images: true,
    richText: 'markdown',
    dates: 'date-object',
  },
  
  // Populate
  populate: {
    default: ['*'],
    depth: 2,
    maxDepth: 5,
  },
  
  // Hooks
  hooks: {
    'schema:fetched': async (schema) => {
      console.log('Schema fetched');
    }
  }
});
```

---

## 📋 8. Funcionalidades Core (MVP)

### Comando: `init`

**El comando más importante** - Primera experiencia del usuario

```bash
npx strapi-integrate init
```

#### Flujo Interactivo Completo

```
┌──────────────────────────────────────────────┐
│                                              │
│   ✨ Strapi Integrate v1.0.0                │
│   Setup your Strapi CMS integration          │
│                                              │
└──────────────────────────────────────────────┘

◆  Project detected
│  Framework: Astro 4.0.1
│  Language: TypeScript 5.3.3
│  Package Manager: pnpm
│
◇  Is this correct?
│  ● Yes
│  ○ No, let me configure manually
│
◆  How do you want to connect to Strapi?
│  ○ Enter URL manually
│  ● Detect from environment (.env)
│  ○ Use Strapi Cloud (requires login)
│  ○ Local Strapi (auto-detect)
│
◇  Environment file found: .env.local
│  STRAPI_URL=https://cms.example.com
│
◆  Authentication method?
│  ● API Token (recommended)
│  ○ JWT Token (for user-based auth)
│  ○ None (public API only)
│
◇  Testing connection...
│  ✓ Connected successfully to Strapi v5.0.0
│  ✓ Found 12 content types
│
◆  How do you want to fetch data?
│  ● Astro Actions (type-safe, recommended)
│  ○ API Routes (REST endpoints)
│  ○ Direct fetch (SSR/SSG only)
│  ○ Hybrid (all of the above)
│
◆  Select features to enable:
│  ☑ Type generation
│  ☑ Services generation
│  ☑ Cache layer
│  ☑ Image optimization
│  ☑ i18n support
│  ☐ GraphQL (REST detected)
│  ☐ Real-time updates (webhooks)
│
◆  Output directory configuration:
│  Types: ./src/types/strapi
│  Services: ./src/services/strapi
│  Actions: ./src/actions/strapi
│
◇  Customize paths?
│  ○ Yes
│  ● No, use defaults
│
◆  Install Astro Integration?
│  ● Yes (auto-sync in dev, recommended)
│  ○ No (manual CLI only)
│
◇  Installing dependencies...
│  ✓ @strapi/sdk-plugin
│  ✓ @strapi-integrate/astro
│
◇  Generating files...
│  ✓ strapi.config.ts
│  ✓ Types (12 content types)
│  ✓ Services (12 services)
│  ✓ Actions (24 actions)
│  ✓ Client configuration
│
◇  Configuring Astro integration...
│  ✓ astro.config.mjs updated
│
└  ✨ Setup complete!

   Next steps:
   
   1. Add your Strapi credentials to .env:
      STRAPI_URL=https://your-strapi.com
      STRAPI_TOKEN=your-api-token
   
   2. Start development server:
      pnpm dev
   
   3. Use in your pages:
      import { actions } from 'astro:actions';
      const posts = await actions.posts.getAll();
   
   4. Learn more:
      https://docs.strapi-integrate.dev/getting-started

   Enjoy! 🚀
```

### Comando: `sync`

**Sincroniza cambios del CMS**

```bash
strapi-integrate sync
```

**Output:**

```
┌ Strapi Integrate - Sync
│
◇ Fetching schema from Strapi...
│ ✓ Schema fetched successfully
│
◇ Comparing with local schema...
│ Changes detected:
│
│   Collections:
│     ~ Modified: Post
│       + New field: featured (boolean)
│       ~ Modified: content (text → richtext)
│     + New: Product
│       Fields: title, description, price, images
│     - Deleted: OldModel
│
│   Components:
│     ~ Modified: Hero
│       + New field: ctaLink (string)
│
◇ Regenerating affected files...
│ ✓ types/collections/post.ts
│ ✓ types/collections/product.ts (new)
│ ✓ types/components/hero.ts
│ ✓ services/posts.service.ts
│ ✓ services/products.service.ts (new)
│ ✓ actions/posts.actions.ts
│ ✓ actions/products.actions.ts (new)
│
◇ Removing obsolete files...
│ ✗ types/collections/old-model.ts
│ ✗ services/old-model.service.ts
│
└ ✓ Sync complete!
  
  Summary:
  - 3 files modified
  - 3 files created
  - 2 files removed
  
  ⚠ Breaking changes detected:
  See migration guide: ./strapi-migrate-2024-01-26.md
```

### Comando: `add`

**Agregar features o content-types específicos**

```bash
strapi-integrate add <feature>
```

**Ejemplos:**

```bash
# Features
strapi-integrate add cache
strapi-integrate add i18n
strapi-integrate add image-optimization

# Content-types
strapi-integrate add collection posts
strapi-integrate add single homepage

# Múltiples
strapi-integrate add cache i18n
```

### Comando: `generate`

**Generar código específico**

```bash
strapi-integrate generate <type> <name>
```

**Ejemplos:**

```bash
# Generar servicio
strapi-integrate generate service posts

# Generar tipos
strapi-integrate generate types posts

# Generar actions
strapi-integrate generate actions posts

# Todo para un content-type
strapi-integrate generate all posts
```

### Comando: `watch`

**Modo watch para desarrollo**

```bash
strapi-integrate watch
```

**Output:**

```
┌ Strapi Integrate - Watch Mode
│
◇ Starting watch mode...
│ ✓ Connected to Strapi
│ ✓ Initial sync complete
│
◇ Watching for changes...
│ Poll interval: 5000ms
│ Press Ctrl+C to stop
│
│ [12:34:56] No changes
│ [12:35:01] No changes
│ [12:35:06] Changes detected! Syncing...
│             + New field: Post.featured
│             ✓ Types regenerated
│ [12:35:11] No changes
```

### Comando: `upgrade`

**Detectar y migrar cambios del schema**

```bash
strapi-integrate upgrade
```

### Otros Comandos Útiles

```bash
# Ver configuración
strapi-integrate config show

# Validar configuración
strapi-integrate config validate

# Test de conexión
strapi-integrate test connection

# Ver versión
strapi-integrate --version

# Ayuda
strapi-integrate --help
```

---

**FIN DE PARTE 1**

Continúa en: `strapi-integrate-plan-part2.md`
