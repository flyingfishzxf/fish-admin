---
title: Installation
description: Install @fish-admin/react, load its stylesheet and wrap your app in UIProvider.
---

# Installation

`@fish-admin/react` is the component library behind the FishAdmin template. It ships 83
components, the design tokens they use and a small `UIProvider` that supplies locale and theme.
The package is ESM-only and has no router, store or i18n runtime dependency.

## Requirements

- React 19 and React DOM 19 (peer dependencies)
- A bundler that understands ESM
- Modern browsers with `oklch()` and CSS custom properties

## Install

```bash
pnpm add @fish-admin/react react@^19 react-dom@^19
```

`pnpm` installs the peer dependencies explicitly; with npm or yarn, add `react` and `react-dom`
yourself so the package does not pull a second copy.

## Load the stylesheet

Import the compiled stylesheet once, next to your app entry:

```ts
import '@fish-admin/react/styles.css'
```

The file contains the design tokens, the component utilities and a minimal base layer. It does
**not** include Tailwind's preflight, so it will not reset an existing application. If your app
has no reset, opt in explicitly:

```ts
import '@fish-admin/react/preflight.css'
import '@fish-admin/react/styles.css'
```

## Use Tailwind 4 to extend the tokens

The compiled stylesheet is enough to render the components. If your own app runs Tailwind 4 and
you want to compose new classes from the package's tokens, scan the published artifacts:

```css
@import 'tailwindcss';
@source 'node_modules/@fish-admin/react/dist';
```

Keep the `@source` path pointed at `dist`, not at the TypeScript source. The build output keeps
the complete class names that Tailwind needs to see.

## Provide locale and theme

Wrap the part of the tree that renders FishAdmin UI components:

```tsx
import { Button, UIProvider } from '@fish-admin/react'
import '@fish-admin/react/styles.css'

export function App() {
  return (
    <UIProvider locale="en" theme="system">
      <Button>Create project</Button>
    </UIProvider>
  )
}
```

`locale` accepts `'en'` or `'zh-CN'`; `theme` accepts `'light'`, `'dark'` or `'system'`. Without a
provider the components fall back to English and the light theme, so the provider is optional but
recommended.

Date controls read the provider locale, not the browser language. A language switcher must
re-render the provider with the new locale, or dates will stay in the previous language.

## What the package does not do

It does not fetch data, route, or enforce permissions. Business screens in the template combine
the components with TanStack Router, TanStack Query and a mock API; none of that ships in the
package.

**Client-side permission checks are a UX layer, not a security boundary.** Hiding a button or a
route prevents confusion; it does not prevent a request. Keep authorization on the server.
