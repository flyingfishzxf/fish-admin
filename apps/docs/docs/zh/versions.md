---
title: 版本
description: React 与 Vue 两条线的组件包、模板与文档站版本。
---

# 版本

| 表面                 | 版本  | 状态                                                                   |
| -------------------- | ----- | ---------------------------------------------------------------------- |
| `@fish-admin/react`  | 0.2.2 | 已发布到 npm。                                                         |
| `@fish-admin/vue`    | 1.0.0 | 已发布到 npm；90 个组件导出。                                          |
| `@fish-admin/tokens` | 0.1.1 | 已发布到 npm；0.1.0 已被取代。                                         |
| React 模板           | 2.3.0 | 已上线；[演示站](https://fish-admin-react-demo.vercel.app)运行 2.3.0。 |
| Vue 模板             | 2.3.0 | 已上线；[演示站](https://fish-admin-vue-demo.vercel.app)运行 2.3.0。   |
| React 文档           | 0.4.0 | 已上线；由 `main` 部署。                                               |
| Vue 文档             | 1.0.0 | 已上线；由 `main` 部署。                                               |

表格列出的是本仓库中的版本以及各表面的实际状态。
`@fish-admin/tokens` 的 0.1.0 与 0.1.1 同日发布：0.1.0 的 `/editor` 入口使用了无扩展名的相对导入，
打包器可用，但 Node 的 ESM 加载器无法解析，0.1.1 修复了该问题。

## 站点

| 表面           | URL                                        |
| -------------- | ------------------------------------------ |
| 门面           | <https://fish-admin.vercel.app>            |
| React 模板演示 | <https://fish-admin-react-demo.vercel.app> |
| Vue 模板演示   | <https://fish-admin-vue-demo.vercel.app>   |
| React 组件文档 | <https://fish-admin-react-docs.vercel.app> |
| Vue 组件文档   | <https://fish-admin-vue-docs.vercel.app>   |

## 发布记录

- [CHANGELOG](https://github.com/flyingfishzxf/fish-admin/blob/main/CHANGELOG.md)
- [GitHub Releases](https://github.com/flyingfishzxf/fish-admin/releases)

## 兼容性

- `@fish-admin/react` 的 peer 依赖是 React 19 与 React DOM 19。
- `@fish-admin/vue` 的 peer 依赖是 Vue 3.5.45 及以上。
- 两个包都是 ESM-only，没有 CommonJS 产物。
- 组件面向支持 `oklch()` 与 CSS 自定义属性的现代浏览器。

## Vue 3

`@fish-admin/vue` 1.0.0 实现了 React 的全部 83 个组件 id，并新增 7 个 Vue 独有组件：
bulk-actions-bar、command-dialog、data-table、error-state、loading-overlay、page-header 与
progress-bar。它与 React 共享设计令牌以及框架无关的 contracts、i18n 与 mock 包，但不共享实现。
[Vue 文档](https://fish-admin-vue-docs.vercel.app)列出每个导出及其实时演示。
