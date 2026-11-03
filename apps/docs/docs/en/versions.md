---
title: Versions
description: Package, template and documentation versions.
---

# Versions

| Surface              | Version | Status                            |
| -------------------- | ------- | --------------------------------- |
| `@fish-admin/react`  | 0.2.2   | Live on npm.                      |
| `@fish-admin/tokens` | 0.1.1   | Live on npm; 0.1.0 is superseded. |
| Template             | 2.2.0   | Live; the demo serves 2.2.0.      |
| Docs site            | 0.3.0   | Live; deployed from `main`.       |

The table lists the versions in this repository. "Live" means the package is on npm or the site is
deployed from `main`. `@fish-admin/tokens` 0.1.0 was replaced by 0.1.1 on the same day: 0.1.0
shipped extensionless imports in its `/editor` entry, which bundlers accept but Node's ESM loader
rejects.

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
