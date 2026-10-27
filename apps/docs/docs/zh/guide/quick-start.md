---
title: 快速开始
description: 用 Button、Card 与 UIProvider 搭出第一个界面。
---

# 快速开始

这一页用组件库搭一个小界面，不引入任何业务依赖。

## 第一个界面

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle, UIProvider } from '@fish-admin/react'
import '@fish-admin/react/styles.css'

export function ProjectCard() {
  return (
    <UIProvider locale="zh-CN" theme="light">
      <Card>
        <CardHeader>
          <CardTitle>季度报告</CardTitle>
        </CardHeader>
        <CardContent>
          <p>12 分钟前更新。</p>
          <Button>打开报告</Button>
          <Button variant="ghost">稍后处理</Button>
        </CardContent>
      </Card>
    </UIProvider>
  )
}
```

三条规则能让第一个界面保持可预期：

1. 在应用入口引入一次样式。
2. 用唯一的 `UIProvider` 包住组件树，它负责语言、主题与组件文案。
3. 页面布局用你自己的 CSS 或 Tailwind。包里提供组件样式，不提供页面布局系统。

## 加一个数据表

`ProTable` 接收 TanStack Table 实例，数据与列定义留在你的代码里：

```tsx
import { ProTable } from '@fish-admin/react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

<ProTable table={table} empty={<p>没有数据</p>} />
```

模板的 `/users` 页是完整版本：服务端形态的分页、行选择、列显隐和 mock API。你可以从 ProTable
页面的「在模板中的用法」直接打开它。

## 接下来

- [主题](/zh/guide/theming)说明设计令牌的约定。
- [组件](/zh/components)列出全部 83 个导出。
- [模板](/zh/template)记录使用组件库的应用本身。

**客户端权限判断只是交互层，不是安全边界。** 模板会根据登录角色隐藏控件，但 API 仍必须对每个
请求做授权。
