# Prompt: Landing Page para strapi-integrate

## Sobre el Producto

**strapi-integrate** es un CLI open-source que genera automáticamente código TypeScript desde Strapi CMS: tipos, servicios y Astro Actions. Un comando, todo listo.

**Tagline:** "De Strapi a tu frontend en segundos"

---

## Paleta de Colores

| Uso | Color |
|-----|-------|
| Fondo principal | `#0A0A0A` |
| Fondo secundario | `#111111` |
| Fondo cards | `#161616` |
| Bordes | `#222222` |
| Texto principal | `#FFFFFF` |
| Texto secundario | `#888888` |
| Acento primario | `#4822F4` (púrpura) |
| Acento secundario | `#D6F9F3` (mint) |

**Uso de acentos:**
- `#4822F4` → Botones principales, enlaces hover, badges activos
- `#D6F9F3` → Highlights de código, iconos, detalles sutiles, texto destacado

---

## Estructura de la Landing

```
┌─────────────────────────────────────────────┐
│                  NAVBAR                      │
│  Logo          Docs | GitHub | npm     ⭐    │
├─────────────────────────────────────────────┤
│                                             │
│                   HERO                       │
│                                             │
│         De Strapi a tu frontend             │
│              en segundos                     │
│                                             │
│   Genera tipos, servicios y Astro Actions   │
│     automáticamente desde tu Strapi CMS     │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ $ npx strapi-integrate init     📋  │   │
│   └─────────────────────────────────────┘   │
│                                             │
│       [Documentación]   [GitHub →]          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│              PROBLEMA/SOLUCIÓN              │
│                                             │
│   ┌─────────────┐     ┌─────────────┐      │
│   │   ANTES     │     │  DESPUÉS    │      │
│   │             │     │             │      │
│   │ • Tipos     │     │ Un comando  │      │
│   │   manuales  │ →   │ todo listo  │      │
│   │ • HTTP      │     │             │      │
│   │   repetitivo│     │ $ sync      │      │
│   └─────────────┘     └─────────────┘      │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│                 FEATURES                     │
│                                             │
│   ┌───────┐  ┌───────┐  ┌───────┐          │
│   │ Type  │  │ Astro │  │ i18n  │          │
│   │ Safe  │  │Actions│  │       │          │
│   └───────┘  └───────┘  └───────┘          │
│                                             │
│   ┌───────┐  ┌───────┐  ┌───────┐          │
│   │Draft &│  │Pagina-│  │Arqui- │          │
│   │Publish│  │ción   │  │tectura│          │
│   └───────┘  └───────┘  └───────┘          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│              CÓMO FUNCIONA                  │
│                                             │
│   1. Init  ─────────────────────────────    │
│      $ npx strapi-integrate init            │
│                                             │
│   2. Sync  ─────────────────────────────    │
│      $ npx strapi-integrate sync            │
│                                             │
│   3. Usa   ─────────────────────────────    │
│      import { getArticles } from '...'      │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│             CÓDIGO GENERADO                 │
│                                             │
│   [Types]  [Service]  [Actions]             │
│   ┌─────────────────────────────────────┐   │
│   │ export interface Article {          │   │
│   │   documentId: string;               │   │
│   │   title: string;                    │   │
│   │   content: string;                  │   │
│   │ }                                   │   │
│   └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│                ROADMAP                       │
│                                             │
│   ✓ Astro    ○ Next.js    ○ Nuxt           │
│              ○ SvelteKit  ○ Remix           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│                  CTA                         │
│                                             │
│        Empieza en menos de un minuto        │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ $ npx strapi-integrate init     📋  │   │
│   └─────────────────────────────────────┘   │
│                                             │
│             [Ver documentación]             │
│                                             │
├─────────────────────────────────────────────┤
│                  FOOTER                      │
│                                             │
│   MIT License  •  GitHub  •  npm            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Contenido por Sección

### 1. Navbar

- Logo: "strapi-integrate" en blanco, minimalista
- Links: Docs | GitHub | npm
- Opcional: Star count de GitHub

---

### 2. Hero

**Título:**
```
De Strapi a tu frontend
en segundos
```

**Subtítulo:**
```
Genera tipos, servicios y Astro Actions
automáticamente desde tu Strapi CMS
```

**Comando principal:**
```bash
npx strapi-integrate init
```

**Botones:**
- Primario: "Documentación" (fondo `#4822F4`)
- Secundario: "GitHub →" (outline blanco)

---

### 3. Problema / Solución

**Antes (lado izquierdo, más opaco):**
- Escribir interfaces TypeScript manualmente
- Crear servicios HTTP repetitivos
- Configurar Actions uno por uno
- Mantener todo sincronizado

**Después (lado derecho, destacado con `#D6F9F3`):**
- Un comando genera todo
- Tipos desde tu schema real
- Servicios CRUD completos
- Actions listas para usar
- Re-sync cuando cambies Strapi

---

### 4. Features (grid 3x2)

| Feature | Descripción |
|---------|-------------|
| **Type-Safe** | Tipos TypeScript generados desde tu schema: collections, singles, components, media y relations. |
| **Astro Actions** | Actions pre-configuradas con validación Zod. CRUD completo para cada content type. |
| **i18n Ready** | Genera archivo de locales disponibles. Servicios con parámetro `locale` condicional. |
| **Draft & Publish** | Soporte para estados draft/published en servicios (solo donde está habilitado). |
| **Paginación** | Page-based (`page`, `pageSize`) y offset-based (`start`, `limit`) en servicios. |
| **Arquitectura flexible** | Elige entre `by-layer` (default) o `by-feature` (screaming architecture). |

---

### 5. Cómo Funciona (3 pasos)

**Paso 1: Inicializa**
```bash
npx strapi-integrate init
```
Detecta tu framework y configura la conexión

**Paso 2: Sincroniza**
```bash
npx strapi-integrate sync
```
Genera tipos, servicios y actions

**Paso 3: Usa**
```typescript
import { articleService } from '@/strapi/services/article.service';

const { data, pagination } = await articleService.findMany({
  locale: 'es',
  status: 'published',
  pagination: { page: 1, pageSize: 10 }
});
```

---

### 6. Código Generado (tabs interactivos)

**Tab: Types**
```typescript
export interface Article extends StrapiBaseEntity {
  title: string;
  slug: string;
  content: BlocksContent;
  cover?: StrapiMedia | null;
  author?: Author | null;
  categories?: Category[];
}
```

**Tab: Service**
```typescript
export const articleService = {
  async findMany(options?: FindManyOptions) {
    // Pagination, filters, locale, status
  },
  async findOne(documentId: string, options?: FindOneOptions) { },
  async findBySlug(slug: string, options?: FindOneOptions) { },
  async create(data) { },
  async update(documentId: string, data) { },
  async delete(documentId: string) { },
  async count(filters?) { },
};
```

**Tab: Actions**
```typescript
export const article = {
  getAll: defineAction({
    input: z.object({
      pagination: paginationSchema,
      sort: z.union([z.string(), z.array(z.string())]).optional(),
    }).optional(),
    handler: async (input) => articleService.findMany(input),
  }),
  getOne: defineAction({ /* ... */ }),
  create: defineAction({ /* ... */ }),
  update: defineAction({ /* ... */ }),
  delete: defineAction({ /* ... */ }),
};
```

---

### 7. Roadmap

| Framework | Estado |
|-----------|--------|
| Astro | ✓ Disponible (badge `#4822F4`) |
| Next.js | Próximamente |
| Nuxt | Próximamente |
| SvelteKit | Próximamente |
| Remix | Próximamente |

**Próximas features:**
- Autenticación con Strapi (Auth.js integration)
- Soporte para Strapi Users & Permissions
- Generación de hooks React/Vue/Svelte

---

### 8. CTA Final

**Título:** "Empieza en menos de un minuto"

**Comando:**
```bash
npx strapi-integrate init
```

**Link:** "Ver documentación completa →"

---

### 9. Footer

```
MIT License  •  GitHub  •  npm  •  Docs

Hecho para la comunidad de Strapi
```

---

## Notas de Diseño

### Tipografía

- Títulos: Inter o Geist Sans, weight 600
- Código: JetBrains Mono o Fira Code
- Body: Inter, weight 400

### Espaciado

- Secciones: 120-160px de padding vertical
- Cards: 24-32px de padding interno
- Muy aireado, minimalista

### Código blocks

- Fondo: `#161616`
- Borde: `#222222`
- Syntax highlight sutil con `#D6F9F3` para strings/keywords
- Botón copiar en esquina superior derecha

### Cards de features

- Sin bordes visibles o borde muy sutil `#222222`
- Icono pequeño arriba (línea, no filled)
- Hover: borde cambia a `#333333`

### Animaciones (sutiles)

- Fade in al hacer scroll
- Hover en botones: ligero scale o glow
- Terminal en hero: typing effect opcional

---

## Stack Técnico (para la sección de docs o FAQ)

- **Runtime dependency:** `strapi-sdk-js` (community SDK)
- **Strapi version:** v5
- **Node.js:** 18+
- **Frameworks soportados:** Astro (MVP)
