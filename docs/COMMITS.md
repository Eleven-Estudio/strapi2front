# Conventional Commits Guide

Este proyecto utiliza [Conventional Commits](https://www.conventionalcommits.org/) para mantener un historial de commits limpio y generar changelogs automáticos.

## Formato del Mensaje

```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]

[pie opcional]
```

## Tipos Disponibles

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat(cli): add init command` |
| `fix` | Corrección de bug | `fix(generators): resolve import paths` |
| `docs` | Solo documentación | `docs: update README` |
| `style` | Formato, sin cambio de código | `style(core): fix indentation` |
| `refactor` | Refactorización | `refactor(cli): extract prompts to separate file` |
| `perf` | Mejora de rendimiento | `perf(generators): optimize type generation` |
| `test` | Agregar o corregir tests | `test(core): add config loader tests` |
| `build` | Sistema de build o deps | `build: update tsup config` |
| `ci` | Configuración de CI | `ci: add GitHub Actions workflow` |
| `chore` | Otras tareas | `chore: update .gitignore` |
| `revert` | Revertir commit | `revert: feat(cli): add init command` |

## Alcances (Scopes)

| Scope | Paquete/Área |
|-------|--------------|
| `cli` | `packages/cli` |
| `core` | `packages/core` |
| `generators` | `packages/generators` |
| `client` | `packages/client` |
| `deps` | Actualizaciones de dependencias |
| `release` | Relacionado a releases |
| `config` | Cambios de configuración |

## Ejemplos

### Feature simple
```bash
git commit -m "feat(cli): add support for custom output directory"
```

### Bug fix con descripción
```bash
git commit -m "fix(generators): handle circular references in relations

The type generator was failing when two content types had
bidirectional relations. This fix adds cycle detection."
```

### Breaking change
```bash
git commit -m "feat(core)!: change configuration file format

BREAKING CHANGE: The configuration file now uses a different schema.
Users need to update their strapi.config.ts files.

Before:
  output: 'src/strapi'

After:
  output: {
    path: 'src/strapi',
    structure: 'by-layer'
  }"
```

### Múltiples cambios relacionados
```bash
git commit -m "refactor(generators): reorganize service generator

- Extract helper functions to utils
- Add support for conditional imports
- Improve type safety"
```

### Documentación
```bash
git commit -m "docs: add contributing guidelines"
```

### Dependencias
```bash
git commit -m "build(deps): upgrade typescript to 5.4.0"
```

## Reglas Importantes

### El mensaje debe:
- Usar tipo en minúsculas: `feat`, no `Feat` o `FEAT`
- Descripción en minúsculas (después del `:`): `add feature`, no `Add feature`
- No terminar con punto: `add feature`, no `add feature.`
- Ser conciso pero descriptivo (máx 100 caracteres)
- Usar imperativo: `add`, `fix`, `change`, no `added`, `fixed`, `changed`

### Breaking Changes

Para cambios que rompen compatibilidad:

1. **Opción 1**: Agregar `!` después del tipo/scope
   ```
   feat(core)!: new config format
   ```

2. **Opción 2**: Agregar footer `BREAKING CHANGE:`
   ```
   feat(core): new config format

   BREAKING CHANGE: Config schema has changed
   ```

## Validación Automática

Los commits son validados automáticamente con `commitlint`. Si el formato es incorrecto, el commit será rechazado:

```bash
# ✅ Válido
git commit -m "feat(cli): add sync command"

# ❌ Inválido - tipo incorrecto
git commit -m "feature(cli): add sync command"

# ❌ Inválido - sin tipo
git commit -m "add sync command"

# ❌ Inválido - descripción en mayúsculas
git commit -m "feat(cli): Add sync command"
```

## Flujo Recomendado

1. **Hacer cambios** en tu código
2. **Agregar al staging**:
   ```bash
   git add .
   ```
3. **Crear commit** con mensaje convencional:
   ```bash
   git commit -m "feat(cli): add new feature"
   ```
4. **Si los cambios afectan versiones publicadas**, crear changeset:
   ```bash
   pnpm changeset
   ```

## Recursos

- [Conventional Commits Spec](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Commitlint](https://commitlint.js.org/)
