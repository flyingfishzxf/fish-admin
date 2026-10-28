---
title: 版本
description: 组件包、模板与文档站的版本。
---

# 版本

| 表面                | 版本  | 状态                                                     |
| ------------------- | ----- | -------------------------------------------------------- |
| `@fish-admin/react` | 0.1.0 | 仅存在于仓库，尚未发布到 npm。                           |
| 模板                | 2.0.0 | 待发布；<https://fish-admin.vercel.app> 仍在运行 1.7.0。 |
| 文档站              | 0.1.0 | 仅存在于仓库，随 2.0.0 发布一起部署。                    |

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
