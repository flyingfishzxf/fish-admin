---
title: 版本
description: 组件包、模板与文档站的版本。
---

# 版本

| 表面                 | 版本  | 状态                             |
| -------------------- | ----- | -------------------------------- |
| `@fish-admin/react`  | 0.2.0 | 已就绪；npm 上仍是 0.1.1。       |
| `@fish-admin/tokens` | 0.1.0 | 已就绪；尚未发布到 npm。         |
| 模板                 | 2.1.0 | 已就绪；演示站仍运行 2.0.1。     |
| 文档站               | 0.2.0 | 已就绪；已部署站点仍运行 0.1.1。 |

表格列出的是本仓库中的版本。“已就绪”表示该版本已通过发布门禁；npm 与部署站点会单独更新。
组件包首次公开发布后遵循语义化版本。在那之前，次版本号可能随仓库检查点变化。

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
