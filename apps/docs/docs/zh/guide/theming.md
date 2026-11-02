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

## 动效

动效也属于令牌契约，主题编辑器只需改令牌就能整体加快或放慢签名过渡，不必改组件代码。

| 令牌                       | 值                                  | 用途                   |
| -------------------------- | ----------------------------------- | ---------------------- |
| `--motion-duration-fast`   | `150ms`                             | Tooltip、Popover、菜单 |
| `--motion-duration-base`   | `200ms`                             | 对话框、手风琴、箭头   |
| `--motion-duration-slow`   | `300ms`                             | Sheet 打开与关闭       |
| `--motion-ease-standard`   | `cubic-bezier(0.2, 0, 0, 1)`        | 进入与退出             |
| `--motion-ease-emphasized` | `cubic-bezier(0.25, 1.15, 0.35, 1)` | 可选的回弹             |
| `--motion-ease-exit`       | `cubic-bezier(0.4, 0, 1, 1)`        | 退出                   |

Dialog、Sheet、Drawer、DropdownMenu、Popover、Tooltip、Accordion 这七个组件消费这些令牌。系统开启
`prefers-reduced-motion: reduce` 时，它们通过 `motion-reduce:` 工具类移除过渡和动画，而不是用全局
规则把加载指示器一起冻结。主题编辑器写入同一批变量，拖动时长滑杆即可实时看到变化。

## 高对比度

高对比度分为两层，互相独立：

- `tokens.css` 里的 `@media (prefers-contrast: more)` 覆盖核心文本组合：前景/背景、卡片文本、
  浮层文本、弱化文本，以及次级与主色组合。每种强调色都要求达到 WCAG AAA（7:1），由
  `pnpm test:tokens` 校验。
- `a11y.css` 里的 `@media (forced-colors: active)` 补回 Windows 高对比度模式会抹平的信息：
  2 px 的 `Highlight` 焦点环、禁用控件的 `GrayText`、纯阴影表面的 `CanvasText` 描边，以及选中
  Tab 等 `[data-state="active"]` 元素的 `Highlight` 边框。

模板没有高对比度开关，令牌覆盖跟随操作系统设置。想预览或导出这些值，请用
[主题编辑器](/guide/theme-editor)里的 High contrast 预设。

## 不要复制一套令牌

- 不要新增第二组 `--color-*` 变量；扩展语义令牌。
- 不要在业务页写死 `oklch()` 数值。
- 不要为了拿令牌而引用包的 TypeScript 源码；用 `styles.css`。

包 README 记录了希望用同一组令牌组合新工具类的 Tailwind 4 应用该如何配置 `@source`。
