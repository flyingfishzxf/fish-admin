---
title: 安装
description: 安装 @fish-admin/react、引入样式，并用 UIProvider 包裹应用。
---

# 安装

`@fish-admin/react` 是 FishAdmin 模板背后的组件库，包含 83 个组件、它们使用的设计令牌，以及
一个负责语言与主题的 `UIProvider`。包是 ESM-only，不依赖路由、状态管理或 i18n 运行时。

## 环境要求

- React 19 与 React DOM 19（peer 依赖）
- 支持 ESM 的打包器
- 支持 `oklch()` 与 CSS 自定义属性的现代浏览器

## 安装

```bash
pnpm add @fish-admin/react react@^19 react-dom@^19
```

使用 npm 或 yarn 时请自行安装 `react` 与 `react-dom`，避免包里出现第二份 React。

## 引入样式

在应用入口引入一次编译后的样式：

```ts
import '@fish-admin/react/styles.css'
```

文件包含设计令牌、组件用到的工具类和一层最小基础样式，**不包含** Tailwind 的 preflight，
因此不会重置已有应用的样式。如果你的应用没有自己的 reset，可以显式引入：

```ts
import '@fish-admin/react/preflight.css'
import '@fish-admin/react/styles.css'
```

## 用 Tailwind 4 扩展令牌

只渲染组件时，编译后的样式已经足够。如果你的应用运行 Tailwind 4，想用包里的设计令牌组合新
类名，请扫描发布产物：

```css
@import 'tailwindcss';
@source 'node_modules/@fish-admin/react/dist';
```

`@source` 指向 `dist`，不要指向 TypeScript 源码。构建产物保留了 Tailwind 需要的完整类名。

## 提供语言与主题

把渲染 FishAdmin UI 组件的部分包起来：

```tsx
import { Button, UIProvider } from '@fish-admin/react'
import '@fish-admin/react/styles.css'

export function App() {
  return (
    <UIProvider locale="zh-CN" theme="system">
      <Button>创建项目</Button>
    </UIProvider>
  )
}
```

`locale` 接受 `'en'` 或 `'zh-CN'`；`theme` 接受 `'light'`、`'dark'` 或 `'system'`。没有
provider 时组件回退到英文与浅色主题，因此 provider 可选，但推荐使用。

日期组件读取的是 provider 的语言，不是浏览器语言。语言切换器必须用新语言重新渲染 provider，
否则日期会停留在旧语言。

## 包不负责什么

它不请求数据、不做路由、也不执行权限判断。模板里的业务页把组件与 TanStack Router、TanStack
Query 和 mock API 组合起来，这些都不在包里。

**客户端权限判断只是交互层，不是安全边界。** 隐藏按钮或路由只能减少误操作，不能阻止请求；
授权必须留在服务端。
