# Release Workflow

Guía para publicar nuevas versiones de strapi2front a npm.

## Requisitos previos

- Node.js 18+
- pnpm instalado (`npm install -g pnpm`)
- Acceso a npm con permisos para publicar en `@strapi2front/*`
- Estar logueado en npm (`npm login`)

## Flujo de Release

### 1. Hacer los cambios en el código

Realiza los cambios necesarios en el código y pruébalos localmente.

```bash
# Compilar para probar
pnpm build

# Probar el CLI localmente
node packages/cli/dist/bin/strapi2front.js
```

### 2. Crear el commit

```bash
# Ver los cambios
git status
git diff

# Agregar los archivos modificados
git add <archivos>

# Crear el commit con mensaje descriptivo
git commit -m "tipo(scope): descripción"
```

**Tipos de commit:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `chore`: Tareas de mantenimiento
- `refactor`: Refactorización de código

### 3. Crear el changeset

```bash
pnpm changeset
```

Esto abrirá un wizard interactivo:

1. **¿Qué paquetes cambiaron?** - Selecciona con espacio los paquetes afectados
2. **¿Tipo de cambio?**
   - `patch` (0.0.X) - Bug fixes, cambios menores
   - `minor` (0.X.0) - Nueva funcionalidad compatible
   - `major` (X.0.0) - Cambios que rompen compatibilidad
3. **Descripción** - Escribe qué cambió (aparecerá en el CHANGELOG)

### 4. Aplicar la versión

```bash
pnpm changeset version
```

Esto:
- Incrementa las versiones en `package.json`
- Genera/actualiza los archivos `CHANGELOG.md`
- Elimina los archivos de changeset consumidos

### 5. Commit de la versión

```bash
git add .
git commit -m "chore(release): vX.X.X"
```

### 6. Build

```bash
pnpm build
```

### 7. Publicar a npm

```bash
pnpm changeset publish
```

### 8. Push a GitHub

```bash
git push origin main --follow-tags
```

---

## Comandos rápidos

### Release completo (después de hacer cambios)

```bash
# 1. Commit de cambios
git add . && git commit -m "feat: descripción del cambio"

# 2. Crear y aplicar changeset
pnpm changeset
pnpm changeset version

# 3. Commit, build y publish
git add . && git commit -m "chore(release): bump version"
pnpm build
pnpm changeset publish

# 4. Push
git push origin main --follow-tags
```

### Solo build local (sin publicar)

```bash
pnpm build
node packages/cli/dist/bin/strapi2front.js
```

---

## Estructura de paquetes

| Paquete | npm | Descripción |
|---------|-----|-------------|
| `strapi2front` | `strapi2front` | CLI principal |
| `@strapi2front/core` | `@strapi2front/core` | Lógica central |
| `@strapi2front/client` | `@strapi2front/client` | Cliente HTTP para Strapi |
| `@strapi2front/generators` | `@strapi2front/generators` | Generadores de código |
| `website` | ❌ (private) | Sitio web - no se publica |

---

## Troubleshooting

### "version X.X.X is already published"

El changeset no incrementó la versión. Verifica:

```bash
# Ver si hay changesets pendientes
ls .changeset/*.md

# Aplicar changesets pendientes
pnpm changeset version
```

### Error de GitHub token

Si ves error de `GITHUB_TOKEN`, el changelog está configurado para usar GitHub. La configuración actual usa changelog simple que no requiere token.

### El website se intenta publicar

Verificar que `apps/web/package.json` tenga:

```json
{
  "private": true,
  ...
}
```

### Verificar versiones actuales

```bash
# Ver versión del CLI
cat packages/cli/package.json | grep '"version"'

# Ver todas las versiones
cat packages/*/package.json | grep -A1 '"name"'
```

---

## Links útiles

- **npm**: https://www.npmjs.com/package/strapi2front
- **GitHub**: https://github.com/Eleven-Estudio/strapi2front
- **Changesets docs**: https://github.com/changesets/changesets
