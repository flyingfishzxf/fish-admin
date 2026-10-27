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

## Do not fork the tokens

- Do not add a second set of `--color-*` variables; extend the semantic tokens instead.
- Do not hardcode `oklch()` values in business pages.
- Do not import the package's TypeScript source to reach the tokens; use `styles.css`.

The package README documents the Tailwind 4 `@source` setup for applications that want to compose
new utilities from the same tokens.
