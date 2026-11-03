---
title: 版本
description: 组件包、模板与文档站的版本。
---

# 版本

| 表面                 | 版本  | 状态                           |
| -------------------- | ----- | ------------------------------ |
| `@fish-admin/react`  | 0.2.2 | 已发布到 npm。                 |
| `@fish-admin/tokens` | 0.1.1 | 已发布到 npm；0.1.0 已被取代。 |
| 模板                 | 2.2.0 | 已上线；演示站运行 2.2.0。     |
| 文档站               | 0.3.0 | 已上线；随 `main` 部署。       |

表格列出的是本仓库中的版本。“已发布/已上线”表示包已在 npm 上，或站点已随 `main` 部署。
`@fish-admin/tokens` 的 0.1.0 与 0.1.1 同日发布：0.1.0 的 `/editor` 入口使用了无扩展名的相对导入，
打包器可用，但 Node 的 ESM 加载器无法解析，0.1.1 修复了该问题。

## 发布记录

- [CHANGELOG](https://github.com/flyingfishzxf/fish-admin/blob/main/CHANGELOG.md)
- [GitHub Releases](https://github.com/flyingfishzxf/fish-admin/releases)

## 兼容性

- React 19 与 React DOM 19 是 peer 依赖。
- 包是 ESM-only，没有 CommonJS 产物。
- 组件面向支持 `oklch()` 与 CSS 自定义属性的现代浏览器。

## Vue 3

Vue 3 包计划在 React 组件库与本站完成后启动。它会共享设计令牌与组件清单，但不共享 React 实现。
目前不承诺日期。
