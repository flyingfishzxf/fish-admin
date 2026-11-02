# @fish-admin/react

FishAdmin UI — the React component library behind
[FishAdmin](https://github.com/flyingfishzxf/fish-admin). It ships 83 components
built on Radix UI, Tailwind CSS v4 and React 19, plus the design tokens and
utilities the admin template uses.

The package is ESM-only and has no router, store or i18n runtime dependency.

## Install

```bash
pnpm add @fish-admin/react
```

React and React DOM 19 are peer dependencies:

```bash
pnpm add react@^19 react-dom@^19
```

## Styles

Import the compiled stylesheet once, usually next to your app entry:

```ts
import '@fish-admin/react/styles.css'
```

`styles.css` contains the compiled design tokens, the `bg-brand` / `shadow-soft`
style utilities and a minimal base layer. It deliberately does **not** include
Tailwind's preflight, so it cannot reset an existing application's CSS. If your
app has no reset of its own, opt in explicitly:

```ts
import '@fish-admin/react/preflight.css'
import '@fish-admin/react/styles.css'
```

## Design tokens

The colour, radius and motion values are generated from
[`@fish-admin/tokens`](../tokens), inlined into `styles.css`; you do not need to
install that package to use the components. `styles.css` also carries the
`prefers-contrast: more` overrides and the forced-colors rules that keep focus,
disabled and selected states visible.

Seven overlays — Dialog, Sheet, Drawer, DropdownMenu, Popover, Tooltip and
Accordion — animate with `--motion-duration-fast/base/slow` and
`--motion-ease-standard/emphasized/exit`, and disable their animation under
`prefers-reduced-motion: reduce`. Override those custom properties to retime
them. To read the full contract, build a theme editor or export CSS, install
`@fish-admin/tokens` separately; its `editor` entry point is browser-safe.

### Tailwind CSS v4

If your app runs Tailwind 4 and you want to compose new classes with the
package's tokens, point Tailwind at the published artifacts:

```css
@import 'tailwindcss';
@source 'node_modules/@fish-admin/react/dist';
```

## Usage

```tsx
import { Button, UIProvider } from '@fish-admin/react'

export function App() {
  return (
    <UIProvider locale="zh-CN" theme="dark">
      <Button>保存</Button>
    </UIProvider>
  )
}
```

`UIProvider` supplies the locale used by date, number and CSV formatting, the
resolved theme used by portalled overlays, and the UI copy. Props:

| Prop       | Type                            | Default   |
| ---------- | ------------------------------- | --------- |
| `locale`   | `'en' \| 'zh-CN'`               | `'en'`    |
| `theme`    | `'light' \| 'dark' \| 'system'` | `'light'` |
| `messages` | `Record<string, string>`        | `{}`      |

`messages` overrides individual UI strings on top of the built-in locale; use
`{{name}}` placeholders for interpolation. Without a provider the components
fall back to English and the light theme, so a provider is optional.

## Entry points

- `@fish-admin/react` — all components, hooks, utilities and `UIProvider`.
- `@fish-admin/react/styles.css`, `@fish-admin/react/preflight.css` — styles.
- `@fish-admin/react/internal/*` — data-table, page-header, date, tree and CSV
  helpers. These exist for the FishAdmin template and are **not** promised to
  stay stable across minor releases.
