---
title: Versions
description: Package, template and documentation versions.
---

# Versions

| Surface             | Version | Status                                            |
| ------------------- | ------- | ------------------------------------------------- |
| `@fish-admin/react` | 0.1.0   | Published to npm on 2026-10-29.                   |
| Template            | 2.0.0   | Deployed at <https://fish-admin.vercel.app>.      |
| Docs site           | 0.1.0   | Deployed at <https://fish-admin-docs.vercel.app>. |

The package follows semantic versioning after its first public release. Until then the minor
version can change between repository checkpoints.

## Release notes

- [CHANGELOG](https://github.com/flyingfishzxf/fish-admin/blob/main/CHANGELOG.md)
- [GitHub releases](https://github.com/flyingfishzxf/fish-admin/releases)

## Compatibility

- React 19 and React DOM 19 are peer dependencies.
- The package is ESM-only; there is no CommonJS build.
- Components target modern browsers with `oklch()` and CSS custom properties.

## Vue 3

A Vue 3 package is planned after the React library and this documentation site are complete. It
will share the design tokens and the component inventory, not the React implementation. No date
is promised.
