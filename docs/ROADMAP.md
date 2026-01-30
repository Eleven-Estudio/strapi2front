# Roadmap - strapi-integrate

Este documento describe el estado actual del proyecto y las features planificadas para futuras versiones.

---

## Leyenda

| Estado | Significado |
|--------|-------------|
| ✅ | Implementado y funcionando |
| 🚧 | En progreso |
| 📋 | Planificado |
| 💡 | Considerado (necesita feedback) |

---

## v0.1.0 - MVP (Actual)

### Core
- ✅ CLI con comandos `init` y `sync`
- ✅ Detección automática de framework (Astro)
- ✅ Detección de TypeScript y package manager
- ✅ Archivo de configuración `strapi-integrate.config.ts`
- ✅ Conexión a Strapi v5 con API Token

### Generación de Tipos
- ✅ Tipos para Collection Types
- ✅ Tipos para Single Types
- ✅ Tipos para Components
- ✅ Soporte para Media (`StrapiMedia`)
- ✅ Soporte para Relations (con imports automáticos)
- ✅ Soporte para Dynamic Zones
- ✅ Soporte para Blocks (rich text)
- ✅ Tipos de filtros (`*Filters`)
- ✅ Tipos base (`StrapiBaseEntity`, `StrapiPagination`)

### Generación de Services
- ✅ CRUD completo: `findMany`, `findOne`, `create`, `update`, `delete`
- ✅ Método `findAll` (paginación automática)
- ✅ Método `findBySlug` (cuando existe campo slug)
- ✅ Método `count`
- ✅ Soporte i18n: parámetro `locale` condicional
- ✅ Soporte Draft & Publish: parámetro `status` condicional
- ✅ Paginación page-based (`page`, `pageSize`)
- ✅ Paginación offset-based (`start`, `limit`)

### Generación de Actions (Astro)
- ✅ Actions con `defineAction` y `zod`
- ✅ CRUD: `getAll`, `getOne`, `create`, `update`, `delete`
- ✅ Action `getBySlug` (cuando existe campo slug)
- ✅ Action `count`
- ✅ Manejo de errores con `ActionError`

### Arquitectura
- ✅ Estructura `by-layer` (default): `types/`, `services/`, `actions/`
- ✅ Estructura `by-feature`: `collections/{name}/{types,service,actions}.ts`

### i18n
- ✅ Generación de archivo `locales.ts`
- ✅ Tipo `Locale` con union de códigos disponibles
- ✅ Helpers: `isValidLocale`, `getLocaleName`

---

## v0.2.0 - Actions Improvements

### Actions
- 📋 Pasar `locale` a actions (para content types localizados)
- 📋 Pasar `status` a actions (para content types con draftAndPublish)
- 📋 Soporte offset-based en actions (`start`, `limit`)
- 📋 Generar barrel file `src/actions/strapi/index.ts`
- 📋 Auto-registro en `src/actions/index.ts`

### DX Improvements
- 📋 Comando `strapi-integrate check` para verificar conexión
- 📋 Modo watch: `strapi-integrate sync --watch`
- 📋 Mejor logging con spinners y colores

---

## v0.3.0 - Authentication

### Strapi Auth Integration
- 📋 Generación de `auth.ts` con helpers de autenticación
- 📋 Soporte para login/register con Strapi Users & Permissions
- 📋 Helper `strapiAuth.login(identifier, password)`
- 📋 Helper `strapiAuth.register(email, username, password)`
- 📋 Helper `strapiAuth.forgotPassword(email)`
- 📋 Helper `strapiAuth.resetPassword(code, password)`
- 📋 Helper `strapiAuth.changePassword(oldPassword, newPassword)`
- 📋 Helper `strapiAuth.getMe()` (usuario actual)

### Auth.js Integration (Astro)
- 📋 Provider de credentials para Strapi
- 📋 Configuración automática de Auth.js
- 📋 Middleware de protección de rutas
- 📋 Componentes de ejemplo (LoginForm, RegisterForm)

### Ejemplo de código generado:
```typescript
// src/strapi/auth.ts
import { strapi } from './client';

export interface StrapiUser {
  id: number;
  documentId: string;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  jwt: string;
  user: StrapiUser;
}

export const strapiAuth = {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    return strapi.login({ identifier, password });
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return strapi.register({ username, email, password });
  },

  async forgotPassword(email: string): Promise<{ ok: boolean }> {
    return strapi.forgotPassword({ email });
  },

  async resetPassword(code: string, password: string, passwordConfirmation: string): Promise<AuthResponse> {
    return strapi.resetPassword({ code, password, passwordConfirmation });
  },

  async getMe(token: string): Promise<StrapiUser> {
    // Fetch current user with JWT
  },
};
```

```typescript
// src/auth.config.ts (Auth.js)
import Credentials from '@auth/core/providers/credentials';
import { strapiAuth } from './strapi/auth';

export default {
  providers: [
    Credentials({
      name: 'Strapi',
      credentials: {
        identifier: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { user, jwt } = await strapiAuth.login(
            credentials.identifier as string,
            credentials.password as string
          );
          return { ...user, jwt };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.jwt = user.jwt;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.jwt = token.jwt;
      return session;
    },
  },
};
```

---

## v0.4.0 - Multi-Framework Support

### Next.js
- 📋 Detección de Next.js (App Router / Pages Router)
- 📋 Generación de Server Actions (App Router)
- 📋 Generación de API Routes (Pages Router)
- 📋 Integración con NextAuth.js

### Nuxt
- 📋 Detección de Nuxt 3
- 📋 Generación de composables (`useStrapi*`)
- 📋 Integración con Nuxt Auth

### SvelteKit
- 📋 Detección de SvelteKit
- 📋 Generación de server actions
- 📋 Generación de stores

### Remix
- 📋 Detección de Remix
- 📋 Generación de loaders y actions

---

## v0.5.0 - Advanced Features

### Media Handling
- 📋 Helper para upload de archivos
- 📋 Helper para generar URLs de imágenes con transformaciones
- 📋 Soporte para Cloudinary/S3 providers

### Real-time
- 💡 Soporte para Strapi webhooks
- 💡 Generación de listeners para cambios

### GraphQL
- 💡 Opción para generar cliente GraphQL en lugar de REST
- 💡 Generación de queries y mutations

### CLI Enhancements
- 📋 Comando `strapi-integrate generate type <name>` (generar un tipo específico)
- 📋 Comando `strapi-integrate diff` (mostrar cambios pendientes)
- 📋 Soporte para múltiples instancias de Strapi

---

## Backlog / Ideas

Estas son ideas que podrían implementarse basadas en feedback de la comunidad:

- 💡 Plugin de VS Code con autocompletado mejorado
- 💡 Generación de tests unitarios para services
- 💡 Dashboard web para visualizar el schema
- 💡 Soporte para Strapi plugins custom
- 💡 Generación de documentación OpenAPI
- 💡 Integración con Storybook para componentes
- 💡 CLI interactivo con TUI (terminal UI)

---

## Cómo Contribuir

¿Quieres ayudar a implementar alguna feature?

1. Revisa los [issues abiertos](https://github.com/tu-usuario/strapi-integrate/issues)
2. Lee la [guía de contribución](./CONTRIBUTING.md)
3. Haz fork y crea un PR

¿Tienes una idea que no está en el roadmap? Abre un issue con el label `enhancement`.

---

## Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial de versiones.
