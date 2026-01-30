# Project Status - strapi-integrate

> Última actualización: 2026-01-28

Este documento rastrea el progreso del proyecto y las prioridades actuales.

---

## Leyenda

| Estado | Significado |
|--------|-------------|
| ✅ | Completado |
| 🚧 | En progreso |
| ⏳ | Pendiente |
| 🐛 | Bug/Fix requerido |
| 💡 | Idea/Considerado |

---

## Bugs Críticos

| Estado | Descripción | Archivo |
|--------|-------------|---------|
| ✅ | Error de tipado en `client.ts` v4 - `id` en `findOne`, etc. | `src/generators/client.ts` |
| ✅ | Detectar versión de Strapi automáticamente (v4 vs v5) | CLI `init`/`sync` |

---

## Versiones

### v0.1.0 - MVP ✅ COMPLETADO

#### Core
- [x] CLI con comandos `init` y `sync`
- [x] Detección automática de framework (Astro)
- [x] Detección de TypeScript y package manager
- [x] Archivo de configuración `strapi-integrate.config.ts`
- [x] Conexión a Strapi v5 con API Token

#### Generación de Tipos
- [x] Tipos para Collection Types
- [x] Tipos para Single Types
- [x] Tipos para Components
- [x] Soporte para Media (`StrapiMedia`)
- [x] Soporte para Relations (con imports automáticos)
- [x] Soporte para Dynamic Zones
- [x] Soporte para Blocks (rich text)
- [x] Tipos de filtros (`*Filters`)
- [x] Tipos base (`StrapiBaseEntity`, `StrapiPagination`)

#### Generación de Services
- [x] CRUD completo: `findMany`, `findOne`, `create`, `update`, `delete`
- [x] Método `findAll` (paginación automática)
- [x] Método `findBySlug` (cuando existe campo slug)
- [x] Método `count`
- [x] Soporte i18n: parámetro `locale` condicional
- [x] Soporte Draft & Publish: parámetro `status` condicional
- [x] Paginación page-based (`page`, `pageSize`)
- [x] Paginación offset-based (`start`, `limit`)

#### Generación de Actions (Astro)
- [x] Actions con `defineAction` y `zod`
- [x] CRUD: `getAll`, `getOne`, `create`, `update`, `delete`
- [x] Action `getBySlug` (cuando existe campo slug)
- [x] Action `count`
- [x] Manejo de errores con `ActionError`

#### Arquitectura
- [x] Estructura `by-layer` (default): `types/`, `services/`, `actions/`
- [x] Estructura `by-feature`: `collections/{name}/{types,service,actions}.ts`

#### i18n
- [x] Generación de archivo `locales.ts`
- [x] Tipo `Locale` con union de códigos disponibles
- [x] Helpers: `isValidLocale`, `getLocaleName`

---

### v0.2.0 - Actions Improvements ⏳

#### Actions
- [ ] Pasar `locale` a actions (para content types localizados)
- [ ] Pasar `status` a actions (para content types con draftAndPublish)
- [ ] Soporte offset-based en actions (`start`, `limit`)
- [ ] Generar barrel file `src/actions/strapi/index.ts`
- [ ] Auto-registro en `src/actions/index.ts`

#### DX Improvements
- [ ] Comando `strapi-integrate check` para verificar conexión
- [ ] Modo watch: `strapi-integrate sync --watch`
- [ ] Mejor logging con spinners y colores

---

### v0.3.0 - Authentication ⏳

#### Strapi Auth Integration
- [ ] Generación de `auth.ts` con helpers de autenticación
- [ ] Helper `strapiAuth.login(identifier, password)`
- [ ] Helper `strapiAuth.register(email, username, password)`
- [ ] Helper `strapiAuth.forgotPassword(email)`
- [ ] Helper `strapiAuth.resetPassword(code, password)`
- [ ] Helper `strapiAuth.changePassword(oldPassword, newPassword)`
- [ ] Helper `strapiAuth.getMe()` (usuario actual)

#### Auth.js Integration (Astro)
- [ ] Provider de credentials para Strapi
- [ ] Configuración automática de Auth.js
- [ ] Middleware de protección de rutas
- [ ] Componentes de ejemplo (LoginForm, RegisterForm)

---

### v0.4.0 - Multi-Framework Support ⏳

#### Next.js
- [ ] Detección de Next.js (App Router / Pages Router)
- [ ] Generación de Server Actions (App Router)
- [ ] Generación de API Routes (Pages Router)
- [ ] Integración con NextAuth.js

#### Nuxt
- [ ] Detección de Nuxt 3
- [ ] Generación de composables (`useStrapi*`)
- [ ] Integración con Nuxt Auth

#### SvelteKit
- [ ] Detección de SvelteKit
- [ ] Generación de server actions
- [ ] Generación de stores

#### Remix
- [ ] Detección de Remix
- [ ] Generación de loaders y actions

---

### v0.5.0 - Advanced Features ⏳

#### Media Handling
- [ ] Helper para upload de archivos
- [ ] Helper para generar URLs de imágenes con transformaciones
- [ ] Soporte para Cloudinary/S3 providers

#### Real-time
- [ ] Soporte para Strapi webhooks
- [ ] Generación de listeners para cambios

#### GraphQL
- [ ] Opción para generar cliente GraphQL en lugar de REST
- [ ] Generación de queries y mutations

#### CLI Enhancements
- [ ] Comando `strapi-integrate generate type <name>`
- [ ] Comando `strapi-integrate diff`
- [ ] Soporte para múltiples instancias de Strapi

---

## Backlog / Ideas 💡

- [ ] Plugin de VS Code con autocompletado mejorado
- [ ] Generación de tests unitarios para services
- [ ] Dashboard web para visualizar el schema
- [ ] Soporte para Strapi plugins custom
- [ ] Generación de documentación OpenAPI
- [ ] Integración con Storybook para componentes
- [ ] CLI interactivo con TUI (terminal UI)

---

## Prioridades Actuales

| # | Prioridad | Tarea | Estado |
|---|-----------|-------|--------|
| 1 | 🟠 Alta | Completar v0.2.0 - Actions Improvements | ⏳ |
| 2 | 🟡 Media | v0.3.0 - Authentication | ⏳ |
| 3 | 🟡 Media | v0.4.0 - Next.js support | ⏳ |

---

## Notas de Progreso

### 2026-01-28
- Implementada detección automática de versión de Strapi
  - Nueva pregunta en `init` para seleccionar versión (v4/v5)
  - Nueva función `detectStrapiVersion()` en core
  - Validación en `sync` que compara versión configurada vs detectada
  - Auto-corrección si hay mismatch de versiones
- Documentación inicial del estado del proyecto
- MVP v0.1.0 completado al 100%
- 1 bug crítico pendiente (tipado v4 client.ts)

---

## Cómo Actualizar Este Documento

1. Cambiar `[ ]` a `[x]` cuando completes una tarea
2. Mover items de ⏳ a 🚧 cuando estés trabajando en ellos
3. Agregar notas en la sección "Notas de Progreso"
4. Actualizar la fecha de "Última actualización" arriba
