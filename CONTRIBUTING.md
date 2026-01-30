# Contributing to strapi2front

Thank you for your interest in contributing to strapi2front! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Versioning](#versioning)
- [Project Structure](#project-structure)

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all experience levels.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/strapi2front.git
   cd strapi2front
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build all packages:
   ```bash
   pnpm build
   ```

## Development Workflow

### Running in Development

```bash
# Build all packages
pnpm build

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

### Testing Changes Locally

To test the CLI locally in another project:

```bash
# From the strapi2front root
cd packages/cli
node dist/bin/strapi2front.js <command>

# Or link globally (may require sudo)
pnpm link --global
```

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This enables automatic changelog generation and semantic versioning.

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Changes that don't affect code meaning (formatting, etc) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `build` | Changes to build system or dependencies |
| `ci` | Changes to CI configuration |
| `chore` | Other changes that don't modify src or test files |
| `revert` | Reverts a previous commit |

### Scopes

| Scope | Package |
|-------|---------|
| `cli` | packages/cli |
| `core` | packages/core |
| `generators` | packages/generators |
| `client` | packages/client |
| `deps` | Dependency updates |
| `release` | Release related |
| `config` | Configuration changes |

### Examples

```bash
# Feature
feat(cli): add support for custom output paths

# Bug fix
fix(generators): resolve import path for relations

# Documentation
docs: update README with new configuration options

# Breaking change (add ! after type)
feat(core)!: change config schema structure

BREAKING CHANGE: The config file format has changed.
```

### Commit Validation

Commits are validated using commitlint. Invalid commits will be rejected:

```bash
# Valid
git commit -m "feat(cli): add sync command"

# Invalid (will be rejected)
git commit -m "added sync command"
git commit -m "FEAT: Add sync command"
```

## Pull Request Process

### Before Submitting

1. **Create a changeset** (if your changes affect published packages):
   ```bash
   pnpm changeset
   ```

   Follow the prompts to:
   - Select affected packages
   - Choose version bump type (patch/minor/major)
   - Write a summary of changes

2. **Ensure all checks pass**:
   ```bash
   pnpm build
   pnpm typecheck
   pnpm lint
   pnpm test
   ```

3. **Update documentation** if needed

### PR Guidelines

- Use a descriptive title following conventional commits format
- Reference any related issues
- Include a clear description of the changes
- Add screenshots for UI changes if applicable
- Keep PRs focused and reasonably sized

### Review Process

1. Automated checks must pass
2. At least one maintainer review required
3. All conversations must be resolved
4. Squash and merge preferred

## Versioning

We use [Changesets](https://github.com/changesets/changesets) for version management.

### Creating a Changeset

When you make changes that should be released:

```bash
pnpm changeset
```

This will:
1. Ask which packages are affected
2. Ask what type of version bump (major/minor/patch)
3. Ask for a summary (this appears in the changelog)

### Version Bump Guidelines

| Change Type | Version | Example |
|-------------|---------|---------|
| Breaking changes | Major | `1.0.0` → `2.0.0` |
| New features (backwards compatible) | Minor | `1.0.0` → `1.1.0` |
| Bug fixes, patches | Patch | `1.0.0` → `1.0.1` |

### Releasing (Maintainers Only)

```bash
# Update versions based on changesets
pnpm version

# Publish to npm
pnpm release
```

## Project Structure

```
strapi2front/
├── packages/
│   ├── cli/          # Main CLI package (strapi2front)
│   ├── core/         # Core functionality (config, schema parsing)
│   ├── generators/   # Code generators (types, services, actions)
│   └── client/       # Optional client utilities
├── .changeset/       # Changeset configuration
├── .husky/           # Git hooks
└── docs/             # Documentation
```

### Package Dependencies

```
strapi2front (cli)
    └── @strapi2front/core
    └── @strapi2front/generators
            └── @strapi2front/core
```

## Questions?

Feel free to open an issue for any questions or suggestions!
