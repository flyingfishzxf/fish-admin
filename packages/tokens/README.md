# @fish-admin/tokens

Design tokens for [FishAdmin](https://github.com/flyingfishzxf/fish-admin). One
JSON contract compiles to raw CSS, a Tailwind 4 theme entry, a machine-readable
manifest and browser-safe editor helpers.

This package is the source of truth for every colour, radius and motion value
used by `@fish-admin/react` and the template. `@fish-admin/react/styles.css`
already inlines the compiled tokens, so applications that only use the React
package do not need to install this one.

## Install

```bash
pnpm add @fish-admin/tokens
```

The package is ESM-only and has no runtime dependencies.

## Entry points

- `@fish-admin/tokens/tokens.css` — `:root` and `.dark` declarations, accent
  presets and the `prefers-contrast: more` overrides. Plain CSS, no Tailwind.
- `@fish-admin/tokens/theme.css` — `tokens.css` plus the `@custom-variant dark`
  and `@theme inline` mappings Tailwind 4 needs to generate utilities such as
  `bg-primary`.
- `@fish-admin/tokens/manifest.json` — groups, bilingual descriptions,
  light/dark/high-contrast values, accent presets, motion tokens and
  `editable` flags.
- `@fish-admin/tokens` — the same manifest as a typed object plus the
  `TokenDefinition` and `ThemeManifest` types.
- `@fish-admin/tokens/editor` — browser-safe helpers for building a theme
  editor: validation, sanitisation, contrast calculation and serialisation.

## Usage

Plain CSS:

```css
@import '@fish-admin/tokens/tokens.css';
```

Tailwind CSS v4:

```css
@import 'tailwindcss';
@import '@fish-admin/tokens/theme.css';
```

The theme entry emits the `@theme` mappings, so token-backed utilities are
available without copying values into your own stylesheet. Switch themes by
toggling `dark` on the root element; switch accent presets with
`data-accent="cyan" | "emerald" | "orange" | "rose"`.

## Building a theme editor

The editor helpers never touch the DOM and are safe to bundle:

```ts
import { contrastRatio, sanitizeTheme, themeToCss } from '@fish-admin/tokens/editor'
import manifest from '@fish-admin/tokens/manifest.json'

const theme = sanitizeTheme(untrustedInput, manifest)
const css = themeToCss(theme)
console.log(contrastRatio(theme.light['--foreground'], theme.light['--background']))
```

`sanitizeTheme` accepts only token names from the manifest, drops values that
do not match the declared token type and rejects characters that could escape a
CSS declaration. Unknown or unsafe input is ignored rather than echoed.

## Editing the tokens

`src/tokens.json` is the only place a token may be declared. After editing it:

```bash
pnpm --filter @fish-admin/tokens build
pnpm --filter @fish-admin/tokens check
pnpm --filter @fish-admin/tokens test
```

`build` regenerates `dist/`; `check` fails when `dist/` is stale, a token has
no Tailwind mapping or a declaration is duplicated. The repository-level
`pnpm check:tokens` additionally rejects token declarations anywhere outside
this package.

Each token includes a `type` (`color`, `length`, `duration` or `easing`), a
`group`, bilingual descriptions and an `editable` flag. High-contrast values are
required for text and surface tokens; motion tokens cover the seven animated
components in the React package.

## Licence

MIT
