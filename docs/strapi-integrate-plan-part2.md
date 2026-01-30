# Plan Estratégico: CLI Open Source para Integración de Strapi CMS
## PARTE 2 de 3

---

## 9. 🧩 Arquitectura de Generación de Código

### Layers de Abstracción

El sistema está diseñado en capas para separar responsabilidades y maximizar la reutilización de código:

```
┌─────────────────────────────────────────────────┐
│        Framework Integration Layer              │
│   (Astro Integration, Next Plugin, etc.)        │
│   - Build hooks                                 │
│   - Dev server integration                      │
│   - HMR (Hot Module Reload)                     │
│   - Vite/Webpack plugins                        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         Developer Interface Layer               │
│     (Actions, API Routes, Components)           │
│   - Type-safe APIs                              │
│   - Framework-specific patterns                 │
│   - Auto-complete friendly                      │
│   - Validation schemas                          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Service Layer                         │
│    (Business Logic, Content Services)           │
│   - CRUD operations                             │
│   - Query building                              │
│   - Validation                                  │
│   - Business rules                              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│          Adapter Layer                          │
│  (Transform, Cache, Validate, Optimize)         │
│   - Data transformation                         │
│   - Caching strategies                          │
│   - Image optimization                          │
│   - i18n handling                               │
│   - Error mapping                               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            Client Layer                         │
│      (Typed Wrapper over Strapi SDK)            │
│   - Type-safe methods                           │
│   - Query builder                               │
│   - Error handling                              │
│   - Request interceptors                        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│          Strapi SDK Layer                       │
│         (@strapi/sdk-plugin)                    │
│   - HTTP client                                 │
│   - Authentication                              │
│   - Request/Response handling                   │
│   - Retry logic                                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Types Layer                           │
│       (Generated TypeScript Types)              │
│   - Content type definitions                    │
│   - Component types                             │
│   - Utility types                               │
│   - Enums and unions                            │
└─────────────────────────────────────────────────┘
```

### Flujo de Datos

**Request Flow (Usuario → Strapi):**
```
User Code (Astro page)
    ↓
[Actions/API Routes] (Developer Interface)
    ↓
[Service Layer] (postsService.findMany)
    ↓
[Adapter Layer] (cache check, transform params)
    ↓
[Client Layer] (strapi.posts.findMany)
    ↓
[Strapi SDK] (HTTP request)
    ↓
Strapi API
```

**Response Flow (Strapi → Usuario):**
```
Strapi API
    ↓
[Strapi SDK] (parse response)
    ↓
[Client Layer] (apply types)
    ↓
[Adapter Layer] (transform data, parse markdown, optimize images)
    ↓
[Service Layer] (business logic)
    ↓
[Actions/API Routes] (return to user)
    ↓
User Code (typed data)
```

### Estructura de Archivos Generada

```
src/
├── strapi/
│   │
│   ├── config.ts                          # Configuración centralizada
│   │   // Exports: strapiConfig
│   │
│   ├── client.ts                          # Cliente tipado principal
│   │   // Exports: strapi (StrapiClient instance)
│   │
│   ├── types/                             # Tipos generados
│   │   ├── index.ts                       # Barrel export
│   │   │
│   │   ├── collections/                   # Collections
│   │   │   ├── post.ts
│   │   │   │   // export interface Post { ... }
│   │   │   │   // export interface PostFilters { ... }
│   │   │   │   // export interface PostPopulate { ... }
│   │   │   │
│   │   │   ├── author.ts
│   │   │   ├── category.ts
│   │   │   └── tag.ts
│   │   │
│   │   ├── singles/                       # Single types
│   │   │   ├── homepage.ts
│   │   │   ├── about.ts
│   │   │   └── settings.ts
│   │   │
│   │   ├── components/                    # Components
│   │   │   ├── hero.ts
│   │   │   ├── cta.ts
│   │   │   └── testimonial.ts
│   │   │
│   │   └── utils.ts                       # Utility types
│   │       // export type StrapiMedia = { ... }
│   │       // export type QueryParams<T> = { ... }
│   │
│   ├── services/                          # Servicios por content-type
│   │   ├── index.ts                       # Barrel export
│   │   │
│   │   ├── posts.service.ts
│   │   │   // export const postsService = {
│   │   │   //   findMany, findOne, findBySlug,
│   │   │   //   findFeatured, findRecent, etc.
│   │   │   // }
│   │   │
│   │   ├── authors.service.ts
│   │   ├── categories.service.ts
│   │   └── tags.service.ts
│   │
│   ├── actions/                           # Astro Actions (si elegido)
│   │   ├── index.ts                       # Barrel export
│   │   │
│   │   ├── posts.actions.ts
│   │   │   // export const posts = {
│   │   │   //   getAll: defineAction({ ... }),
│   │   │   //   getById: defineAction({ ... })
│   │   │   // }
│   │   │
│   │   ├── authors.actions.ts
│   │   └── categories.actions.ts
│   │
│   ├── api/                               # API Routes (si elegido)
│   │   ├── posts/
│   │   │   ├── index.ts                   # GET /api/posts
│   │   │   └── [id].ts                    # GET /api/posts/:id
│   │   │
│   │   └── authors/
│   │       ├── index.ts
│   │       └── [id].ts
│   │
│   ├── adapters/                          # Adaptadores
│   │   ├── cache.adapter.ts               # Caching logic
│   │   ├── transform.adapter.ts           # Data transformations
│   │   ├── image.adapter.ts               # Image optimization
│   │   └── i18n.adapter.ts                # i18n handling
│   │
│   ├── utils/                             # Utilidades
│   │   ├── query-builder.ts               # Query builder
│   │   ├── populate-helper.ts             # Population helpers
│   │   ├── filter-builder.ts              # Filter builder
│   │   ├── image-helper.ts                # Image URL helpers
│   │   └── validation.ts                  # Validation schemas
│   │
│   └── plugins/                           # Plugins del usuario
│       └── custom-transform.ts
│
├── .env                                   # Variables de entorno
├── .env.example                           # Template
└── strapi.config.ts                       # Config principal
```

### Ejemplos de Código Generado

#### Types (Post)

```typescript
// src/strapi/types/collections/post.ts
/**
 * Post content type
 * Generated by @strapi-integrate v1.0.0
 * Last sync: 2024-01-26 12:34:56
 */

import type { Author } from './author';
import type { Category } from './category';
import type { Tag } from './tag';
import type { StrapiMedia } from '../utils';

export interface Post {
  // System fields
  id: number;
  documentId: string;
  
  // Content fields
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured: boolean;
  readingTime?: number;
  
  // Dates
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  author?: Author;
  category?: Category;
  tags?: Tag[];
  coverImage?: StrapiMedia;
  
  // i18n
  locale?: string;
  localizations?: Post[];
}

export interface PostFilters {
  // Text fields
  title?: string | {
    $eq?: string;
    $ne?: string;
    $contains?: string;
    $notContains?: string;
    $startsWith?: string;
    $endsWith?: string;
  };
  
  slug?: string | { $eq?: string };
  
  // Boolean
  featured?: boolean;
  
  // Date filters
  publishedAt?: {
    $eq?: Date;
    $ne?: Date;
    $gt?: Date;
    $gte?: Date;
    $lt?: Date;
    $lte?: Date;
    $between?: [Date, Date];
  };
  
  // Relations
  author?: {
    id?: number;
    slug?: string;
  };
  
  category?: {
    id?: number;
    slug?: string;
  };
  
  // Logical operators
  $and?: PostFilters[];
  $or?: PostFilters[];
  $not?: PostFilters;
}

export interface PostPopulate {
  author?: boolean | {
    populate?: ['avatar', 'socialLinks'];
  };
  category?: boolean;
  tags?: boolean;
  coverImage?: boolean;
  localizations?: boolean;
}

export interface PostSort {
  field: keyof Post;
  order: 'asc' | 'desc';
}
```

#### Service (Posts)

```typescript
// src/strapi/services/posts.service.ts
/**
 * Posts service
 * Generated by @strapi-integrate v1.0.0
 * 
 * Provides methods for interacting with Post content type
 */

import { strapi } from '../client';
import type { 
  Post, 
  PostFilters, 
  PostPopulate 
} from '../types/collections/post';
import type { QueryParams } from '../types/utils';

export const postsService = {
  /**
   * Find many posts
   * @param options - Query options
   * @returns Array of posts
   */
  async findMany(options?: {
    filters?: PostFilters;
    populate?: PostPopulate | '*';
    sort?: string | string[];
    pagination?: {
      page?: number;
      pageSize?: number;
      limit?: number;
      start?: number;
    };
    locale?: string;
    publicationState?: 'live' | 'preview';
  }): Promise<Post[]> {
    return await strapi.posts.findMany(options);
  },
  
  /**
   * Find one post by ID
   * @param id - Post ID
   * @param options - Query options
   * @returns Post or null
   */
  async findOne(
    id: string,
    options?: {
      populate?: PostPopulate | '*';
      locale?: string;
    }
  ): Promise<Post | null> {
    return await strapi.posts.findOne(id, options);
  },
  
  /**
   * Find post by slug
   * @param slug - Post slug
   * @param options - Query options
   * @returns Post or null
   */
  async findBySlug(
    slug: string,
    options?: {
      populate?: PostPopulate | '*';
      locale?: string;
    }
  ): Promise<Post | null> {
    const posts = await this.findMany({
      filters: { slug: { $eq: slug } },
      populate: options?.populate,
      locale: options?.locale,
    });
    return posts[0] || null;
  },
  
  /**
   * Find featured posts
   * @param options - Query options
   * @returns Array of featured posts
   */
  async findFeatured(options?: {
    limit?: number;
    populate?: PostPopulate | '*';
    locale?: string;
  }): Promise<Post[]> {
    return await this.findMany({
      filters: { featured: true },
      populate: options?.populate || ['author', 'coverImage'],
      pagination: { limit: options?.limit || 5 },
      sort: '-publishedAt',
      locale: options?.locale,
    });
  },
  
  /**
   * Find recent posts
   * @param limit - Number of posts to return
   * @param options - Query options
   * @returns Array of recent posts
   */
  async findRecent(
    limit: number = 10,
    options?: {
      populate?: PostPopulate | '*';
      locale?: string;
    }
  ): Promise<Post[]> {
    return await this.findMany({
      filters: { 
        publishedAt: { $lte: new Date() } 
      },
      populate: options?.populate || ['author', 'category', 'coverImage'],
      pagination: { limit },
      sort: '-publishedAt',
      locale: options?.locale,
    });
  },
  
  /**
   * Find posts by category
   * @param categorySlug - Category slug
   * @param options - Query options
   * @returns Array of posts
   */
  async findByCategory(
    categorySlug: string,
    options?: {
      limit?: number;
      populate?: PostPopulate | '*';
      locale?: string;
    }
  ): Promise<Post[]> {
    return await this.findMany({
      filters: { 
        category: { slug: categorySlug } 
      },
      populate: options?.populate,
      pagination: { limit: options?.limit },
      sort: '-publishedAt',
      locale: options?.locale,
    });
  },
  
  /**
   * Find posts by author
   * @param authorId - Author ID
   * @param options - Query options
   * @returns Array of posts
   */
  async findByAuthor(
    authorId: number,
    options?: {
      limit?: number;
      populate?: PostPopulate | '*';
    }
  ): Promise<Post[]> {
    return await this.findMany({
      filters: { 
        author: { id: authorId } 
      },
      populate: options?.populate,
      pagination: { limit: options?.limit },
      sort: '-publishedAt',
    });
  },
  
  /**
   * Search posts by title or content
   * @param query - Search query
   * @param options - Query options
   * @returns Array of posts
   */
  async search(
    query: string,
    options?: {
      limit?: number;
      populate?: PostPopulate | '*';
    }
  ): Promise<Post[]> {
    return await this.findMany({
      filters: {
        $or: [
          { title: { $contains: query } },
          { content: { $contains: query } },
          { excerpt: { $contains: query } },
        ]
      },
      populate: options?.populate,
      pagination: { limit: options?.limit || 20 },
      sort: '-publishedAt',
    });
  },
  
  /**
   * Get posts count
   * @param filters - Optional filters
   * @returns Number of posts
   */
  async count(filters?: PostFilters): Promise<number> {
    const posts = await this.findMany({ filters });
    return posts.length;
  }
};
```

#### Actions (Astro)

```typescript
// src/actions/strapi/posts.actions.ts
/**
 * Posts actions for Astro
 * Generated by @strapi-integrate v1.0.0
 * 
 * Type-safe actions for client and server
 */

import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { postsService } from '../../strapi/services/posts.service';

export const posts = {
  /**
   * Get all posts with pagination
   */
  getAll: defineAction({
    input: z.object({
      limit: z.number().min(1).max(100).optional(),
      page: z.number().min(1).optional(),
      locale: z.string().optional(),
    }).optional(),
    handler: async (input) => {
      return await postsService.findMany({
        pagination: {
          limit: input?.limit || 10,
          page: input?.page || 1,
        },
        populate: ['author', 'category', 'coverImage'],
        locale: input?.locale,
      });
    }
  }),
  
  /**
   * Get post by ID
   */
  getById: defineAction({
    input: z.object({
      id: z.string(),
      locale: z.string().optional(),
    }),
    handler: async ({ id, locale }) => {
      const post = await postsService.findOne(id, {
        populate: ['author', 'category', 'tags', 'coverImage'],
        locale,
      });
      
      if (!post) {
        throw new Error(`Post with ID ${id} not found`);
      }
      
      return post;
    }
  }),
  
  /**
   * Get post by slug
   */
  getBySlug: defineAction({
    input: z.object({
      slug: z.string().min(1),
      locale: z.string().optional(),
    }),
    handler: async ({ slug, locale }) => {
      const post = await postsService.findBySlug(slug, {
        populate: ['author', 'category', 'tags', 'coverImage'],
        locale,
      });
      
      if (!post) {
        throw new Error(`Post with slug "${slug}" not found`);
      }
      
      return post;
    }
  }),
  
  /**
   * Get featured posts
   */
  getFeatured: defineAction({
    input: z.object({
      limit: z.number().min(1).max(20).optional(),
    }).optional(),
    handler: async (input) => {
      return await postsService.findFeatured({
        limit: input?.limit || 5,
        populate: ['author', 'coverImage'],
      });
    }
  }),
  
  /**
   * Get recent posts
   */
  getRecent: defineAction({
    input: z.object({
      limit: z.number().min(1).max(50).optional(),
    }).optional(),
    handler: async (input) => {
      return await postsService.findRecent(
        input?.limit || 10,
        { populate: ['author', 'coverImage'] }
      );
    }
  }),
  
  /**
   * Get posts by category
   */
  getByCategory: defineAction({
    input: z.object({
      categorySlug: z.string().min(1),
      limit: z.number().min(1).max(50).optional(),
    }),
    handler: async ({ categorySlug, limit }) => {
      return await postsService.findByCategory(categorySlug, {
        limit: limit || 20,
        populate: ['author', 'coverImage'],
      });
    }
  }),
  
  /**
   * Search posts
   */
  search: defineAction({
    input: z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(100).optional(),
    }),
    handler: async ({ query, limit }) => {
      return await postsService.search(query, {
        limit: limit || 20,
        populate: ['author', 'coverImage'],
      });
    }
  }),
};
```

### Uso en Aplicación

#### En Página Astro (SSR)

```astro
---
// src/pages/blog/[slug].astro
import { postsService } from '../../strapi/services/posts.service';

const { slug } = Astro.params;
const post = await postsService.findBySlug(slug, {
  populate: ['author', 'category', 'tags', 'coverImage']
});

if (!post) {
  return Astro.redirect('/404');
}
---

<article>
  <h1>{post.title}</h1>
  <p>By {post.author.name}</p>
  <div>{post.content}</div>
</article>
```

#### Desde Cliente (Actions)

```typescript
// src/components/PostList.tsx
import { actions } from 'astro:actions';

export function PostList() {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    async function loadPosts() {
      const data = await actions.posts.getAll({ limit: 10 });
      setPosts(data);
    }
    loadPosts();
  }, []);
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

---

## 10. ⚠️ Consideraciones Técnicas Importantes

### 1. Retrocompatibilidad

**El Problema:**
Los usuarios actualizarán el CLI, pero no querrán que se rompa su código existente.

**La Solución: Semantic Versioning Estricto**

```
v1.0.0 → v1.5.0 → v2.0.0
```

- **Major (2.0.0):** Breaking changes
- **Minor (1.5.0):** New features, backwards compatible
- **Patch (1.0.1):** Bug fixes

**Estrategia de Deprecation:**

```typescript
// v1.0 - Método original
strapi.posts.getAll(); // ✅ Works

// v1.5 - Nuevo método, viejo deprecado
strapi.posts.findMany(); // ✅ New (recommended)
strapi.posts.getAll();   // ⚠️ Deprecated, still works
// Warning: "getAll() is deprecated, use findMany() instead"

// v2.0 - Breaking change
strapi.posts.findMany(); // ✅ Only this works
strapi.posts.getAll();   // ❌ Removed, throws error
```

**Migration Guides Automáticas:**

```markdown
# Migration Guide: v1.x → v2.0

## Breaking Changes

### 1. Method Rename: getAll() → findMany()

**Before:**
```typescript
const posts = await strapi.posts.getAll();
```

**After:**
```typescript
const posts = await strapi.posts.findMany();
```

### 2. Configuration Change

**Before:**
```typescript
{
  populate: true
}
```

**After:**
```typescript
{
  populate: ['author', 'tags']
}
```

## Automatic Migration

Run this command to automatically migrate your code:
```bash
npx strapi-integrate migrate 1.x 2.0
```
```

**Codemods para Migración:**

```bash
# Migrar automáticamente de v1 a v2
npx strapi-integrate migrate 1.x 2.x

# Analiza y muestra cambios sin aplicar
npx strapi-integrate migrate 1.x 2.x --dry-run
```

### 2. Testing Strategy Completa

```
tests/
├── unit/                    # Tests unitarios (rápidos)
│   ├── detectors/
│   │   ├── framework.test.ts
│   │   ├── typescript.test.ts
│   │   └── package-manager.test.ts
│   │
│   ├── generators/
│   │   ├── types.test.ts
│   │   ├── services.test.ts
│   │   └── actions.test.ts
│   │
│   └── utils/
│       ├── query-builder.test.ts
│       └── schema-parser.test.ts
│
├── integration/             # Tests de integración (medios)
│   ├── cli/
│   │   ├── init.test.ts
│   │   ├── sync.test.ts
│   │   └── generate.test.ts
│   │
│   └── client/
│       ├── client.test.ts
│       └── query.test.ts
│
├── e2e/                     # Tests end-to-end (lentos)
│   ├── astro/
│   │   ├── actions.test.ts
│   │   ├── api-routes.test.ts
│   │   └── build.test.ts
│   │
│   ├── next/
│   └── nuxt/
│
└── fixtures/                # Datos de prueba
    ├── strapi-schemas/
    │   ├── blog.json
    │   ├── ecommerce.json
    │   └── corporate.json
    │
    └── projects/
        ├── astro-basic/
        └── astro-typescript/
```

**Niveles de Testing:**

**1. Unit Tests** - Cada función aislada
```typescript
// tests/unit/detectors/framework.test.ts
import { describe, it, expect } from 'vitest';
import { detectFramework } from '../../../src/detectors/framework';

describe('detectFramework', () => {
  it('should detect Astro from package.json', async () => {
    const framework = await detectFramework('/path/to/astro-project');
    expect(framework).toBe('astro');
  });
  
  it('should detect Next.js', async () => {
    const framework = await detectFramework('/path/to/next-project');
    expect(framework).toBe('next');
  });
  
  it('should return null for unknown framework', async () => {
    const framework = await detectFramework('/path/to/unknown');
    expect(framework).toBeNull();
  });
});
```

**2. Integration Tests** - Flujo completo de comandos
```typescript
// tests/integration/cli/init.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('strapi-integrate init', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    // Crear directorio temporal
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'strapi-integrate-test-')
    );
    
    // Setup proyecto Astro básico
    await setupAstroProject(tempDir);
  });
  
  afterEach(async () => {
    // Limpiar
    await fs.remove(tempDir);
  });
  
  it('should detect Astro project', async () => {
    const { stdout } = await execa('strapi-integrate', ['init'], {
      cwd: tempDir,
      env: { CI: 'true' } // Skip interactive prompts
    });
    
    expect(stdout).toContain('Framework: Astro');
  });
  
  it('should generate types', async () => {
    await execa('strapi-integrate', ['init'], {
      cwd: tempDir,
      input: mockAnswers() // Mock user input
    });
    
    const typesExist = await fs.pathExists(
      path.join(tempDir, 'src/strapi/types/index.ts')
    );
    
    expect(typesExist).toBe(true);
  });
  
  it('should generate valid TypeScript', async () => {
    await execa('strapi-integrate', ['init'], { cwd: tempDir });
    
    // Intentar compilar código generado
    const { exitCode, stderr } = await execa('tsc', ['--noEmit'], {
      cwd: tempDir,
      reject: false
    });
    
    expect(exitCode).toBe(0);
    expect(stderr).toBe('');
  });
  
  it('should modify astro.config.mjs if integration chosen', async () => {
    await execa('strapi-integrate', ['init'], {
      cwd: tempDir,
      input: mockAnswersWithIntegration()
    });
    
    const config = await fs.readFile(
      path.join(tempDir, 'astro.config.mjs'),
      'utf-8'
    );
    
    expect(config).toContain('strapiIntegration');
  });
});
```

**3. E2E Tests** - Aplicación real funcionando
```typescript
// tests/e2e/astro/actions.test.ts
import { describe, it, expect } from 'vitest';
import { setupTestProject, buildProject, startDevServer } from '../helpers';

describe('Astro Actions E2E', () => {
  it('should work in production build', async () => {
    const project = await setupTestProject('astro-actions');
    
    // Build proyecto
    await buildProject(project.path);
    
    // Verificar que build fue exitoso
    const distExists = await fs.pathExists(
      path.join(project.path, 'dist')
    );
    expect(distExists).toBe(true);
    
    // Verificar que archivos generados están incluidos
    const actionsExist = await fs.pathExists(
      path.join(project.path, 'dist/_astro/actions/')
    );
    expect(actionsExist).toBe(true);
  });
  
  it('should fetch data correctly in dev mode', async () => {
    const project = await setupTestProject('astro-actions');
    const server = await startDevServer(project.path);
    
    try {
      // Hacer request a la página
      const response = await fetch(`${server.url}/blog/test-post`);
      const html = await response.text();
      
      // Verificar que datos de Strapi se renderizan
      expect(html).toContain('<h1>Test Post</h1>');
      expect(response.status).toBe(200);
    } finally {
      await server.stop();
    }
  });
});
```

**4. Snapshot Testing** - Para código generado
```typescript
// tests/unit/generators/types.test.ts
import { describe, it, expect } from 'vitest';
import { generateTypes } from '../../../src/generators/types';

describe('Type Generator', () => {
  it('should generate correct types for collection', async () => {
    const schema = {
      kind: 'collectionType',
      attributes: {
        title: { type: 'string' },
        content: { type: 'text' },
        author: { type: 'relation', relation: 'manyToOne' }
      }
    };
    
    const generated = await generateTypes(schema);
    
    // Snapshot testing
    expect(generated).toMatchSnapshot();
  });
});
```

### 3. Plugin System Robusto

```typescript
// packages/core/src/plugin.ts

export interface Plugin {
  name: string;
  version: string;
  
  // Schema de configuración del plugin (con Zod)
  configSchema?: z.ZodSchema;
  
  // Inicialización
  setup?: (config: any) => Promise<void> | void;
  
  // Hooks disponibles
  hooks?: {
    // Schema hooks
    'schema:fetched'?: (schema: Schema) => Promise<Schema> | Schema;
    'schema:parsed'?: (parsed: ParsedSchema) => Promise<ParsedSchema> | ParsedSchema;
    
    // Generation hooks
    'types:generate'?: (schema: Schema) => Promise<void> | void;
    'types:generated'?: (files: GeneratedFile[]) => Promise<GeneratedFile[]> | GeneratedFile[];
    
    'services:generate'?: (schema: Schema) => Promise<void> | void;
    'services:generated'?: (files: GeneratedFile[]) => Promise<GeneratedFile[]> | GeneratedFile[];
    
    // Request hooks
    'request:before'?: (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;
    'request:after'?: (response: Response) => Promise<Response> | Response;
    'request:error'?: (error: Error) => Promise<void> | void;
    
    // Transform hooks
    'transform:data'?: (data: any, context: TransformContext) => Promise<any> | any;
    
    // Cache hooks
    'cache:get'?: (key: string) => Promise<any> | any;
    'cache:set'?: (key: string, value: any) => Promise<void> | void;
  };
  
  // Cleanup
  teardown?: () => Promise<void> | void;
}

// Factory function
export function createPlugin<Config = any>(
  plugin: Plugin
): (config?: Config) => Plugin {
  return (config) => {
    // Validar config si hay schema
    if (plugin.configSchema && config) {
      plugin.configSchema.parse(config);
    }
    
    return {
      ...plugin,
      config
    };
  };
}
```

**Ejemplo de Plugin Oficial:**

```typescript
// packages/plugins/cache/src/index.ts

import { createPlugin } from '@strapi-integrate/core';
import { z } from 'zod';

const configSchema = z.object({
  strategy: z.enum(['memory', 'redis', 'file']),
  ttl: z.number().positive().default(60),
  redis: z.object({
    host: z.string(),
    port: z.number(),
  }).optional(),
});

export const cachePlugin = createPlugin({
  name: 'cache',
  version: '1.0.0',
  configSchema,
  
  async setup(config) {
    if (config.strategy === 'redis') {
      await initRedis(config.redis);
    }
  },
  
  hooks: {
    'request:before': async (requestConfig) => {
      const cacheKey = generateCacheKey(requestConfig);
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        // Return cached response
        throw new CacheHit(cached);
      }
      
      return requestConfig;
    },
    
    'request:after': async (response) => {
      const cacheKey = generateCacheKey(response.config);
      await cache.set(cacheKey, response.data, { ttl: config.ttl });
      return response;
    }
  },
  
  async teardown() {
    await cache.disconnect();
  }
});
```

### 4. Error Handling Excellence

**Principios:**
1. Mensajes claros y accionables
2. Sugerencias de solución
3. Links a documentación
4. Context sobre el error

**Implementación:**

```typescript
// packages/core/src/errors.ts

export class StrapiIntegrateError extends Error {
  constructor(
    message: string,
    public code: string,
    public suggestions: string[] = [],
    public docs?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'StrapiIntegrateError';
  }
  
  format(): string {
    let output = `\n❌ ${this.message}\n`;
    
    if (this.suggestions.length > 0) {
      output += `\n💡 Suggestions:\n`;
      this.suggestions.forEach(s => {
        output += `   • ${s}\n`;
      });
    }
    
    if (this.docs) {
      output += `\n📚 Learn more: ${this.docs}\n`;
    }
    
    if (this.cause) {
      output += `\n🔍 Caused by: ${this.cause.message}\n`;
    }
    
    return output;
  }
}

// Errores específicos
export class ConnectionError extends StrapiIntegrateError {
  constructor(url: string, cause?: Error) {
    super(
      `Failed to connect to Strapi at ${url}`,
      'CONNECTION_FAILED',
      [
        'Check if STRAPI_URL is correct in your .env file',
        'Verify your Strapi instance is running',
        `Test connection: curl ${url}/api/`,
        'Check if STRAPI_TOKEN is valid and has permissions',
      ],
      'https://docs.strapi-integrate.dev/troubleshooting/connection',
      cause
    );
  }
}

export class SchemaFetchError extends StrapiIntegrateError {
  constructor(cause?: Error) {
    super(
      'Failed to fetch schema from Strapi',
      'SCHEMA_FETCH_FAILED',
      [
        'Check your STRAPI_TOKEN has read permissions',
        'Verify Content-Type Manager is enabled in Strapi',
        'Try syncing with --force flag to bypass cache',
      ],
      'https://docs.strapi-integrate.dev/troubleshooting/schema',
      cause
    );
  }
}

export class GenerationError extends StrapiIntegrateError {
  constructor(filePath: string, cause?: Error) {
    super(
      `Failed to generate file: ${filePath}`,
      'GENERATION_FAILED',
      [
        'Check if you have write permissions',
        'Verify the output directory exists',
        'Try running with --verbose for more details',
      ],
      'https://docs.strapi-integrate.dev/troubleshooting/generation',
      cause
    );
  }
}
```

**Uso en Código:**

```typescript
// Mal ❌
try {
  await connectToStrapi(url);
} catch (error) {
  throw new Error('Connection failed');
}

// Bien ✅
try {
  await connectToStrapi(url);
} catch (error) {
  throw new ConnectionError(url, error);
}
```

**Output para Usuario:**

```
❌ Failed to connect to Strapi at https://cms.example.com

💡 Suggestions:
   • Check if STRAPI_URL is correct in your .env file
   • Verify your Strapi instance is running
   • Test connection: curl https://cms.example.com/api/
   • Check if STRAPI_TOKEN is valid and has permissions

📚 Learn more: https://docs.strapi-integrate.dev/troubleshooting/connection

🔍 Caused by: ECONNREFUSED
```

### 5. Performance Optimization

**Generación Incremental:**

```typescript
// Solo regenerar lo que cambió
async function sync() {
  const oldSchema = await loadCachedSchema();
  const newSchema = await fetchSchema();
  
  const changes = detectChanges(oldSchema, newSchema);
  
  if (changes.collections.length === 0) {
    console.log('✓ No changes detected, skipping generation');
    return;
  }
  
  // Solo regenerar collections que cambiaron
  await Promise.all([
    ...changes.collections.map(c => generateTypes(c)),
    ...changes.collections.map(c => generateService(c)),
    ...changes.collections.map(c => generateActions(c)),
  ]);
  
  await cacheSchema(newSchema);
}
```

**Parallel Processing:**

```typescript
// Generar archivos en paralelo
await Promise.all([
  generateTypes(collections),
  generateServices(collections),
  generateActions(collections),
]);
```

**Caching Inteligente:**

```typescript
const CACHE_TTL = 3600; // 1 hour

async function fetchSchema(force = false) {
  if (!force) {
    const cached = await cache.get('schema');
    if (cached && !isExpired(cached)) {
      return cached.data;
    }
  }
  
  const schema = await strapi.getSchema();
  await cache.set('schema', schema, { ttl: CACHE_TTL });
  return schema;
}
```

---

## 11. 🚀 Roadmap de Desarrollo

### Overview

El desarrollo se divide en 6 fases principales, con un total estimado de **6-8 meses** para llegar a una versión production-ready con soporte multi-framework.

### Fase 1: MVP Core (4-6 semanas)
**Objetivo:** CLI funcional con Astro + Actions

#### Semana 1-2: Fundación
- [ ] Setup monorepo (pnpm + turborepo)
- [ ] Configuración de tsconfig, eslint, prettier
- [ ] CI/CD básico con GitHub Actions
- [ ] CLI básico con Commander.js
- [ ] Prompts con @clack/prompts
- [ ] Detección de proyecto Astro
- [ ] Detección de TypeScript vs JavaScript
- [ ] Detección de package manager
- [ ] Tests unitarios de detectores
- [ ] Documentación inicial del proyecto

**Entregable:** CLI que detecta proyectos correctamente

#### Semana 3-4: Generación Core
- [ ] Conexión a Strapi API con autenticación
- [ ] Fetch y parse de schema de Strapi
- [ ] Sistema de cache para schema
- [ ] Generación de tipos TypeScript básicos
- [ ] Wrapper sobre @strapi/sdk-plugin
- [ ] Generación de servicios básicos (CRUD)
- [ ] Sistema de templates con Handlebars
- [ ] Formateo con Prettier
- [ ] Tests de generación
- [ ] Fixtures de schemas de prueba

**Entregable:** Generación de tipos y servicios funciona

#### Semana 5-6: Actions + Polish
- [ ] Generación de Astro Actions
- [ ] Validación con Zod en Actions
- [ ] Comando `init` completo con todos los prompts
- [ ] Comando `sync` básico
- [ ] Comando `generate` para regeneración selectiva
- [ ] Tests de integración end-to-end
- [ ] README impecable con ejemplos
- [ ] Documentación básica (Getting Started)
- [ ] Ejemplos de uso
- [ ] Primer release alpha (v0.1.0)

**Entregables:**
- ✅ `npx strapi-integrate init` funciona
- ✅ Genera tipos, servicios, y actions
- ✅ Tests pasando (>80% coverage)
- ✅ Documentación básica
- ✅ Publicado en npm como alpha

### Fase 2: Astro Integration (3-4 semanas)
**Objetivo:** Integración profunda con Astro

#### Semana 7-8: Integration Package
- [ ] Package `@strapi-integrate/astro`
- [ ] Implementar Astro Integration API
- [ ] Build hooks (sync antes de build)
- [ ] Dev hooks (watch mode integration)
- [ ] Auto-sync en modo desarrollo
- [ ] HMR cuando cambien tipos generados
- [ ] Configuración del integration
- [ ] Tests del integration

**Entregable:** Astro Integration funcional

#### Semana 9-10: Features Adicionales
- [ ] Sistema de cache básico (memory)
- [ ] Transform layer para imágenes
- [ ] Transform layer para richtext (markdown)
- [ ] Comando `watch` standalone
- [ ] Comando `add` para agregar features
- [ ] Comando `upgrade` para migrar schema
- [ ] Tests E2E con proyecto Astro real
- [ ] Ejemplos completos (blog, portfolio)
- [ ] Documentación de Astro Integration
- [ ] Release beta (v0.5.0)

**Entregables:**
- ✅ Astro integration instalable y funcional
- ✅ Auto-sync en desarrollo funciona
- ✅ Cache layer básico
- ✅ Ejemplos completos
- ✅ Docs mejoradas

### Fase 3: Flexibilidad y Extensibilidad (3-4 semanas)
**Objetivo:** Dar opciones y permitir customización

#### Semana 11-12: Opciones de Fetching
- [ ] Generación de API Routes como alternativa a Actions
- [ ] Opción de Direct Fetch (solo services, sin Actions)
- [ ] Modo híbrido (Actions + API Routes + Services)
- [ ] Configuración flexible en `strapi.config.ts`
- [ ] Sistema de presets (blog, ecommerce, corporate)
- [ ] Tests para cada modo de fetching
- [ ] Documentación de opciones

**Entregable:** Usuarios pueden elegir cómo fetchear datos

#### Semana 13-14: Plugin System
- [ ] API de plugins con hooks
- [ ] Sistema de configuración de plugins
- [ ] Registry de plugins
- [ ] Plugin oficial: cache (Redis, File, Memory)
- [ ] Plugin oficial: i18n
- [ ] Plugin oficial: image optimization
- [ ] Documentación para crear plugins
- [ ] Ejemplos de plugins custom
- [ ] Release candidate (v0.9.0)

**Entregables:**
- ✅ Plugin system funcional
- ✅ 3 plugins oficiales
- ✅ Docs de extensibilidad
- ✅ Ejemplos de customización

### Fase 4: Multi-Framework (6-8 semanas)
**Objetivo:** Soportar Next.js y Nuxt

#### Semana 15-18: Next.js Support
- [ ] Detección de Next.js (App vs Pages Router)
- [ ] Generación de Server Actions (App Router)
- [ ] Generación de API Routes (Pages Router)
- [ ] Generación de Server Components helpers
- [ ] Plugin de Next.js
- [ ] Integración con next.config.js
- [ ] Tests E2E con Next.js
- [ ] Ejemplos de Next.js
- [ ] Documentación Next.js-específica

**Entregable:** Soporte completo para Next.js

#### Semana 19-22: Nuxt Support
- [ ] Detección de Nuxt 3
- [ ] Generación de composables
- [ ] Generación de server routes
- [ ] Nuxt Module implementation
- [ ] Integración con nuxt.config.ts
- [ ] Tests E2E con Nuxt
- [ ] Ejemplos de Nuxt
- [ ] Documentación Nuxt-específica
- [ ] Release v1.0.0 🎉

**Entregables:**
- ✅ Soporte para Next.js y Nuxt
- ✅ Ejemplos de cada framework
- ✅ Docs completas por framework
- ✅ Versión 1.0.0 estable

### Fase 5: Features Avanzadas (8-10 semanas)
**Objetivo:** Features enterprise-grade

#### Semanas 23-25: GitHub Integration
- [ ] Fetch schema desde GitHub repo
- [ ] Auto-sync cuando cambie repo
- [ ] GitHub App opcional
- [ ] Webhooks de GitHub
- [ ] CI/CD integration guides

#### Semanas 26-28: Advanced Features
- [ ] GraphQL support (además de REST)
- [ ] Multi-environment support (dev, staging, prod)
- [ ] Migration tools automáticos
- [ ] Schema versioning
- [ ] Rollback capabilities

#### Semanas 29-32: Enterprise Features
- [ ] Real-time updates (webhooks de Strapi)
- [ ] Advanced caching strategies (Redis, CDN)
- [ ] Performance optimizations
- [ ] Monitoring y analytics
- [ ] CLI dashboard (TUI con ink)
- [ ] Release v1.5.0

**Entregables:**
- ✅ Features enterprise-ready
- ✅ Performance optimization
- ✅ Advanced caching
- ✅ Real-time capabilities

### Fase 6: Madurez y Ecosistema (Ongoing)
**Objetivo:** Comunidad y adopción masiva

#### Comunidad
- [ ] Plugin marketplace
- [ ] Community plugins showcase
- [ ] Discord/Forum setup
- [ ] Contributor guidelines mejoradas
- [ ] Good first issues para nuevos contributors

#### Contenido
- [ ] Video tutorials series
- [ ] Blog posts técnicos
- [ ] Case studies de usuarios
- [ ] Comparaciones con alternativas
- [ ] Newsletter mensual

#### Outreach
- [ ] Conferencias y talks
- [ ] Colaboración con Strapi team
- [ ] Colaboración con Astro/Next/Nuxt teams
- [ ] Open source partnerships

#### Enterprise
- [ ] Enterprise features (SSO, audit logs)
- [ ] Professional support options
- [ ] Training programs
- [ ] Certification program (?)

---

## 12. 📚 Referencias Clave para Estudiar

### CLIs Modernos (MUST STUDY) ⭐⭐⭐

**1. create-t3-app**
- **Link:** https://github.com/t3-oss/create-t3-app
- **Estudiar:**
  - Sistema de detección de proyecto
  - Prompts interactivos con @clack/prompts
  - Instalación de dependencias
  - Modificación de configs
- **Acción:** Clonar repo y leer source code completo

**2. shadcn/ui CLI**
- **Link:** https://github.com/shadcn-ui/ui
- **Estudiar:**
  - Cómo añade componentes a proyecto existente
  - Detección de configuración (tailwind, typescript)
  - Sistema de templates
  - Overwriting y merging de archivos
- **Acción:** Usar el CLI y analizar cómo funciona

**3. Astro CLI**
- **Link:** https://github.com/withastro/astro
- **Estudiar:**
  - Comando `astro add`
  - Integrations API
  - Cómo modifica astro.config.mjs
- **Acción:** Leer docs de Integrations API

**4. Prisma CLI**
- **Link:** https://github.com/prisma/prisma
- **Estudiar:**
  - `prisma generate` - cómo genera cliente tipado
  - `prisma db pull` - cómo sincroniza schema
  - Sistema de migraciones
  - Type generation desde schema
- **Acción:** Usar Prisma en proyecto de prueba

### Type Generation ⭐⭐⭐

**5. openapi-typescript**
- **Link:** https://github.com/drwpow/openapi-typescript
- **Estudiar:**
  - Algoritmo de generación de tipos
  - Manejo de referencias circulares
  - Generación de utility types
- **Acción:** Analizar source code

**6. graphql-code-generator**
- **Link:** https://the-guild.dev/graphql/codegen
- **Estudiar:**
  - Plugin system
  - Templates
  - Configuration
- **Acción:** Leer documentación completa

### Testing de CLIs ⭐⭐

**7. clig.dev**
- **Link:** https://clig.dev/
- **Estudiar:** COMPLETO - es una guía de best practices
- **Acción:** Leer de principio a fin

**8. Testing Node.js CLIs**
- **Link:** https://kentcdodds.com/blog/how-to-test-a-nodejs-cli
- **Estudiar:** Estrategias de testing

### Strapi (ESENCIAL) ⭐⭐⭐

**9. Strapi REST API Documentation**
- **Link:** https://docs.strapi.io/dev-docs/api/rest
- **Acción:** Leer COMPLETA - es tu biblia

**10. Strapi Content API**
- **Link:** https://docs.strapi.io/dev-docs/api/content-api
- **Estudiar:**
  - Filters
  - Population
  - Sorting
  - Pagination

**11. Strapi SDK Plugin**
- **Link:** Buscar en npm/GitHub (puede no estar public todavía)
- **Estudiar:** Source code completo

### Framework Integrations ⭐⭐⭐

**12. Astro Integrations API**
- **Link:** https://docs.astro.build/en/reference/integrations-reference/
- **Acción:** Leer docs oficiales completas

**13. Astro Actions**
- **Link:** https://docs.astro.build/en/guides/actions/
- **Estudiar:** Cómo funcionan Actions

**14. Next.js App Router**
- **Link:** https://nextjs.org/docs/app
- **Estudiar:** Server Actions, Server Components

**15. unplugin**
- **Link:** https://github.com/unjs/unplugin
- **Estudiar:** Framework-agnostic plugins
- **Por qué:** Puede ayudar para Next/Nuxt plugins

### Tools & Libraries (Usar) ⭐⭐

**Essential:**
- **@clack/prompts:** https://github.com/natemoo-re/clack
- **Commander.js:** https://github.com/tj/commander.js
- **execa:** https://github.com/sindresorhus/execa
- **picocolors:** https://github.com/alexeyraspopov/picocolors
- **ora:** https://github.com/sindresorhus/ora
- **fast-glob:** https://github.com/mrmlnc/fast-glob
- **jiti:** https://github.com/unjs/jiti
- **tsup:** https://github.com/egoist/tsup
- **turborepo:** https://turbo.build/repo
- **vitest:** https://vitest.dev/

### Comunidad y Aprendizaje

**16. Dev.to / Hashnode**
- Buscar: "Building CLI tools with Node.js"
- Buscar: "Type generation"
- Buscar: "Monorepo setup"

**17. YouTube**
- "Building CLI tools" tutorials
- Theo (t3.gg) - sobre create-t3-app
- Jack Herrington - sobre TypeScript

**18. Discord Communities**
- Astro Discord
- Next.js Discord
- Strapi Discord
- The Primeagen (development)

---

**FIN DE PARTE 2**

Continúa en: `strapi-integrate-plan-part3.md`
