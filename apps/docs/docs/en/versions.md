---
title: Versions
description: Package, template and documentation versions across React and Vue.
---

# Versions

| Surface              | Version | Status                                                                   |
| -------------------- | ------- | ------------------------------------------------------------------------ |
| `@fish-admin/react`  | 0.2.2   | Live on npm.                                                             |
| `@fish-admin/vue`    | 1.0.0   | Live on npm; 90 component exports.                                       |
| `@fish-admin/tokens` | 0.1.1   | Live on npm; 0.1.0 is superseded.                                        |
| React template       | 2.3.0   | Live; [the demo](https://fish-admin-react-demo.vercel.app) serves 2.3.0. |
| Vue template         | 2.3.0   | Live; [the demo](https://fish-admin-vue-demo.vercel.app) serves 2.3.0.   |
| React docs           | 0.4.0   | Live; deployed from `main`.                                              |
| Vue docs             | 1.0.0   | Live; deployed from `main`.                                              |

The table lists the versions in this repository and what each surface serves. `@fish-admin/tokens`
0.1.0 was replaced by 0.1.1 on the same day: 0.1.0 shipped extensionless imports in its `/editor`
entry, which bundlers accept but Node's ESM loader rejects.

## Sites

| Surface              | URL                                        |
| -------------------- | ------------------------------------------ |
| Landing              | <https://fish-admin.vercel.app>            |
| React template demo  | <https://fish-admin-react-demo.vercel.app> |
| Vue template demo    | <https://fish-admin-vue-demo.vercel.app>   |
| React component docs | <https://fish-admin-react-docs.vercel.app> |
| Vue component docs   | <https://fish-admin-vue-docs.vercel.app>   |

## Release notes

- [CHANGELOG](https://github.com/flyingfishzxf/fish-admin/blob/main/CHANGELOG.md)
- [GitHub releases](https://github.com/flyingfishzxf/fish-admin/releases)

## Compatibility

- React 19 and React DOM 19 are peer dependencies of `@fish-admin/react`.
- Vue 3.5.45 and later is a peer dependency of `@fish-admin/vue`.
- Both packages are ESM-only; there is no CommonJS build.
- Components target modern browsers with `oklch()` and CSS custom properties.

## Vue 3

`@fish-admin/vue` 1.0.0 implements all 83 React component ids and adds seven Vue-only components:
bulk-actions-bar, command-dialog, data-table, error-state, loading-overlay, page-header and
progress-bar. It shares the design tokens and the framework-neutral contracts, i18n and mock
packages with React, not the implementation. The [Vue docs](https://fish-admin-vue-docs.vercel.app)
list every export with live demos.
