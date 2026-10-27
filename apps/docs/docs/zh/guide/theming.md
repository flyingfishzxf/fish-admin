---
title: 主题
description: 组件库与模板共用的设计令牌、深色模式与强调色。
---

# 主题

组件库用 CSS 自定义属性给所有组件上色。模板与文档站不维护第二套色板，而是消费同一组令牌。

## 核心令牌

| 令牌           | 作用                   |
| -------------- | ---------------------- |
| `--background` | 页面背景               |
| `--foreground` | 默认文字               |
| `--card`       | 卡片、预览区等抬升表面 |
| `--primary`    | 品牌操作色             |
| `--muted`      | 次级表面               |
| `--border`     | 分割线与输入框描边     |
| `--radius`     | 基础圆角（0.75rem）    |

组件只引用语义令牌（`bg-primary`、`text-muted-foreground`），不写死颜色值。覆盖一个令牌，
所有使用它的组件都会一起变化。

## 深色模式

在根元素上加 `dark` 类：

```html
<html class="dark">
  <body>
    ...
  </body>
</html>
```

包在 `.dark` 下定义了每个令牌的深色值。主题切换器只需要切换 `<html>` 上的类名，不需要重渲染
组件树。弹窗、浮层和 Toast 这类 portal 组件从 `UIProvider` 读取解析后的主题，请让它的
`theme` 属性与类名保持同步。

## 强调色

模板通过 `data-accent` 属性提供四种额外强调色：

```html
<html data-accent="cyan"></html>
```

支持 `cyan`、`emerald`、`orange`、`rose`；不写属性时是默认的紫色。强调色只替换 `--primary`、
品牌渐变和第一个图表色，其余色板保持中性是有意为之。

## 圆角与密度

`--radius` 是 `0.75rem`。组件级圆角由它派生（`--radius-sm`、`--radius-md`、`--radius-lg`），
改一个值会同时缩放卡片、按钮和浮层。密度属于组件级选择：用按钮的 `size="sm"` 和表格的
density 属性，而不是用 CSS 把整页缩小。

## 不要复制一套令牌

- 不要新增第二组 `--color-*` 变量；扩展语义令牌。
- 不要在业务页写死 `oklch()` 数值。
- 不要为了拿令牌而引用包的 TypeScript 源码；用 `styles.css`。

包 README 记录了希望用同一组令牌组合新工具类的 Tailwind 4 应用该如何配置 `@source`。
