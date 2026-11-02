---
title: Versions
description: Package, template and documentation versions.
---

# Versions

| Surface              | Version | Status                                          |
| -------------------- | ------- | ----------------------------------------------- |
| `@fish-admin/react`  | 0.2.0   | Prepared; npm still serves 0.1.1.               |
| `@fish-admin/tokens` | 0.1.0   | Prepared; not yet published to npm.             |
| Template             | 2.1.0   | Prepared; the demo still serves 2.0.1.          |
| Docs site            | 0.2.0   | Prepared; the deployed site still serves 0.1.1. |

The table lists the versions in this repository. "Prepared" means the version passes the release
gates; npm and the deployed sites are updated separately. The package follows semantic versioning
after its first public release. Until then the minor version can change between repository
checkpoints.

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
