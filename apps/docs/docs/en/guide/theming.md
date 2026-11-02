---
title: Theming
description: Design tokens, dark mode and accent colors shared by the package and the template.
---

# Theming

The package styles every component with CSS custom properties. The template and the docs site do
not define a second palette; they consume the same tokens.

## Core tokens

| Token          | Role                                       |
| -------------- | ------------------------------------------ |
| `--background` | Page background                            |
| `--foreground` | Default text                               |
| `--card`       | Raised surfaces such as cards and previews |
| `--primary`    | Brand action color                         |
| `--muted`      | Secondary surfaces                         |
| `--border`     | Dividers and input outlines                |
| `--radius`     | Base corner radius (0.75rem)               |

Components reference the semantic tokens (`bg-primary`, `text-muted-foreground`), never fixed color
values. Overriding a token changes every component that uses it.

## Dark mode

Add the `dark` class to the root element:

```html
<html class="dark">
  <body>
    ...
  </body>
</html>
```

The package defines the dark values for every token under `.dark`. A theme switcher only has to
toggle that class on `<html>`; it does not need to re-render the component tree. Portalled overlays
(dialogs, popovers, toasts) read the resolved theme from `UIProvider`, so keep its `theme` prop in
sync with the class.

## Accent colors

The template exposes four alternate accents through a `data-accent` attribute:

```html
<html data-accent="cyan"></html>
```

Supported values are `cyan`, `emerald`, `orange` and `rose`; the default (no attribute) is violet.
An accent only replaces `--primary`, the brand gradient and the first chart color — the rest of the
palette stays neutral on purpose.

## Radius and density

`--radius` is `0.75rem`. Component-level radius derives from it (`--radius-sm`, `--radius-md`,
`--radius-lg`), so changing one value rescales cards, buttons and popovers together. Density is a
component concern: use `size="sm"` on buttons and the table density prop instead of shrinking the
whole page with CSS.

## Motion

Motion is part of the token contract, so a theme editor can speed up or slow down every signature
transition without touching component code.

| Token                      | Value                               | Used for                         |
| -------------------------- | ----------------------------------- | -------------------------------- |
| `--motion-duration-fast`   | `150ms`                             | Tooltips, popovers and menus     |
| `--motion-duration-base`   | `200ms`                             | Dialogs, accordions and chevrons |
| `--motion-duration-slow`   | `300ms`                             | Sheets opening and closing       |
| `--motion-ease-standard`   | `cubic-bezier(0.2, 0, 0, 1)`        | Enter and exit                   |
| `--motion-ease-emphasized` | `cubic-bezier(0.25, 1.15, 0.35, 1)` | Optional overshoot               |
| `--motion-ease-exit`       | `cubic-bezier(0.4, 0, 1, 1)`        | Exits                            |

Dialog, sheet, drawer, dropdown menu, popover, tooltip and accordion consume these tokens. Under
`prefers-reduced-motion: reduce` those seven components drop their transitions and animations via
`motion-reduce:` utilities instead of a global rule that would also freeze loading indicators. The
theme editor writes the same variables, so dragging a duration slider updates the preview live.

## High contrast

High contrast has two independent layers:

- `@media (prefers-contrast: more)` overrides the core text pairs in `tokens.css`: foreground,
  card and popover text, muted text, and the secondary and primary pairs. Every accent is checked
  to reach WCAG AAA (7:1) for those pairs, and `pnpm test:tokens` enforces the contract.
- `@media (forced-colors: active)` in `a11y.css` restores what Windows High Contrast Mode flattens:
  a 2 px `Highlight` focus ring, `GrayText` for disabled controls, a `CanvasText` outline on
  shadow-only surfaces, and a `Highlight` border on selected tabs and other
  `[data-state="active"]` elements.

The template has no high-contrast switch; the token overrides follow the OS setting. To preview or
export them, use the High contrast preset in the [theme editor](/guide/theme-editor).

## Do not fork the tokens

- Do not add a second set of `--color-*` variables; extend the semantic tokens instead.
- Do not hardcode `oklch()` values in business pages.
- Do not import the package's TypeScript source to reach the tokens; use `styles.css`.

The package README documents the Tailwind 4 `@source` setup for applications that want to compose
new utilities from the same tokens.
