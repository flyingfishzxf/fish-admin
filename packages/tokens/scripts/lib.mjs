import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const paths = {
  root: packageRoot,
  source: path.join(packageRoot, 'src/tokens.json'),
  dist: path.join(packageRoot, 'dist'),
  packageJson: path.join(packageRoot, 'package.json'),
}

const TOKEN_TYPES = new Set(['color', 'length', 'duration', 'easing'])
const TOKEN_NAME = /^[a-z][a-z0-9-]*$/
const FORBIDDEN = [';', '{', '}', '<', '>', '\\']

function fail(message) {
  throw new Error(`tokens: ${message}`)
}

function assertLocalized(value, label) {
  if (!value || typeof value.en !== 'string' || typeof value.zh !== 'string') {
    fail(`${label} needs en/zh descriptions`)
  }
}

function assertSafeValue(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail(`${label} must be a non-empty string`)
  if (FORBIDDEN.some((fragment) => value.includes(fragment))) {
    fail(`${label} contains a CSS declaration escape`)
  }
}

export function readSource() {
  return JSON.parse(fs.readFileSync(paths.source, 'utf8'))
}

export function readVersion() {
  return JSON.parse(fs.readFileSync(paths.packageJson, 'utf8')).version
}

export function validateSource(data) {
  if (!data || typeof data !== 'object') fail('source must be an object')
  if (typeof data.name !== 'string') fail('source.name must be a string')
  if (!Array.isArray(data.groups) || data.groups.length === 0)
    fail('source.groups must not be empty')
  if (!Array.isArray(data.tokens) || data.tokens.length === 0)
    fail('source.tokens must not be empty')
  if (!Array.isArray(data.accents) || data.accents.length === 0)
    fail('source.accents must not be empty')
  if (
    !data.theme ||
    typeof data.theme.fontSans !== 'string' ||
    typeof data.theme.fontMono !== 'string'
  ) {
    fail('source.theme.fontSans and fontMono are required')
  }

  const groups = new Set()
  for (const group of data.groups) {
    if (!TOKEN_NAME.test(group.id)) fail(`invalid group id "${group.id}"`)
    if (groups.has(group.id)) fail(`duplicate group "${group.id}"`)
    groups.add(group.id)
    assertLocalized(group.title, `group ${group.id}.title`)
    assertLocalized(group.description, `group ${group.id}.description`)
  }

  const names = new Set()
  const cssVars = new Set()
  const tailwindNames = new Set()

  for (const token of data.tokens) {
    if (!TOKEN_NAME.test(token.name ?? '')) fail(`invalid token name "${token.name}"`)
    if (token.cssVar !== `--${token.name}`) fail(`${token.name}: cssVar must be --${token.name}`)
    if (names.has(token.name)) fail(`duplicate token "${token.name}"`)
    if (cssVars.has(token.cssVar)) fail(`duplicate css variable "${token.cssVar}"`)
    names.add(token.name)
    cssVars.add(token.cssVar)

    if (!TOKEN_TYPES.has(token.type)) fail(`${token.name}: unknown type "${token.type}"`)
    if (!groups.has(token.group)) fail(`${token.name}: unknown group "${token.group}"`)
    assertLocalized(token.description, `${token.name}.description`)
    assertSafeValue(token.light, `${token.name}.light`)
    if (token.dark !== undefined) assertSafeValue(token.dark, `${token.name}.dark`)
    if (typeof token.editable !== 'boolean') fail(`${token.name}: editable must be boolean`)
    if (token.highContrast) {
      assertSafeValue(token.highContrast.light, `${token.name}.highContrast.light`)
      assertSafeValue(token.highContrast.dark, `${token.name}.highContrast.dark`)
    }

    if (token.type === 'color') {
      if (!TOKEN_NAME.test(token.tailwind ?? ''))
        fail(`${token.name}: color tokens need a tailwind name`)
      if (tailwindNames.has(token.tailwind)) fail(`duplicate tailwind color "${token.tailwind}"`)
      tailwindNames.add(token.tailwind)
    } else if (token.tailwind !== undefined) {
      fail(`${token.name}: only color tokens may map to Tailwind`)
    }
    if (token.type === 'duration' || token.type === 'easing') {
      if (token.dark !== undefined) fail(`${token.name}: motion tokens are shared across modes`)
    }
  }

  const tokenByCssVar = new Map(data.tokens.map((token) => [token.cssVar, token]))
  const accentIds = new Set()
  let defaults = 0

  for (const accent of data.accents) {
    if (!TOKEN_NAME.test(accent.id)) fail(`invalid accent id "${accent.id}"`)
    if (accentIds.has(accent.id)) fail(`duplicate accent "${accent.id}"`)
    accentIds.add(accent.id)
    assertLocalized(accent.label, `accent ${accent.id}.label`)
    if (accent.default) defaults += 1

    for (const key of ['light', 'dark', 'highContrastLight', 'highContrastDark']) {
      const overrides = accent[key]
      if (overrides === undefined) continue
      if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
        fail(`accent ${accent.id}.${key} must be an object`)
      }
      for (const [cssVar, value] of Object.entries(overrides)) {
        const token = tokenByCssVar.get(cssVar)
        if (!token) fail(`accent ${accent.id} overrides unknown token ${cssVar}`)
        if (token.type !== 'color') fail(`accent ${accent.id} overrides non-color token ${cssVar}`)
        assertSafeValue(value, `accent ${accent.id}.${key}.${cssVar}`)
      }
    }

    if (!accent.default && (!accent.light || !accent.dark)) {
      fail(`accent ${accent.id} needs both light and dark overrides`)
    }
  }

  if (defaults !== 1) fail(`exactly one accent must be the default, found ${defaults}`)
}

export function buildManifest(data, version) {
  return {
    name: data.name,
    version,
    groups: data.groups,
    tokens: data.tokens,
    accents: data.accents,
    theme: data.theme,
  }
}

function renderBlock(selector, entries, indent = '') {
  if (entries.length === 0) return ''
  const lines = entries.map(([cssVar, value]) => `${indent}  ${cssVar}: ${value};`)
  return `${indent}${selector} {\n${lines.join('\n')}\n${indent}}\n`
}

function joinSections(sections) {
  return `${sections.filter(Boolean).join('\n').trimEnd()}\n`
}

function baseEntries(tokens, mode) {
  return tokens
    .filter((token) => token[mode] !== undefined)
    .map((token) => [token.cssVar, token[mode]])
}

export function renderTokensCss(data) {
  const sections = [
    '/* Generated from src/tokens.json. Run pnpm --filter @fish-admin/tokens build. */\n',
    renderBlock(':root', baseEntries(data.tokens, 'light')),
    renderBlock('.dark', baseEntries(data.tokens, 'dark')),
  ]

  for (const accent of data.accents) {
    if (accent.default) continue
    sections.push(
      renderBlock(`:root[data-accent='${accent.id}']`, Object.entries(accent.light ?? {})),
    )
    sections.push(
      renderBlock(`.dark[data-accent='${accent.id}']`, Object.entries(accent.dark ?? {})),
    )
  }

  const contrast = []
  const highContrastLight = data.tokens
    .filter((token) => token.highContrast)
    .map((token) => [token.cssVar, token.highContrast.light])
  const highContrastDark = data.tokens
    .filter((token) => token.highContrast)
    .map((token) => [token.cssVar, token.highContrast.dark])
  contrast.push(renderBlock(':root', highContrastLight, '  '))
  contrast.push(renderBlock('.dark', highContrastDark, '  '))

  for (const accent of data.accents) {
    if (accent.default) continue
    contrast.push(
      renderBlock(
        `:root[data-accent='${accent.id}']`,
        Object.entries(accent.highContrastLight ?? {}),
        '  ',
      ),
    )
    contrast.push(
      renderBlock(
        `.dark[data-accent='${accent.id}']`,
        Object.entries(accent.highContrastDark ?? {}),
        '  ',
      ),
    )
  }

  if (contrast.filter(Boolean).length) {
    sections.push(
      `@media (prefers-contrast: more) {\n${contrast.filter(Boolean).join('\n').trimEnd()}\n}\n`,
    )
  }

  return joinSections(sections)
}

export function renderThemeCss(data) {
  const colorTokens = data.tokens.filter((token) => token.type === 'color')
  const colorLines = colorTokens.map(
    (token) => `  --color-${token.tailwind}: var(${token.cssVar});`,
  )

  return joinSections([
    '/* Generated from src/tokens.json. Run pnpm --filter @fish-admin/tokens build. */\n',
    "@import './tokens.css';\n",
    '@custom-variant dark (&:is(.dark *));\n',
    [
      '@theme inline {',
      `  --font-sans: ${data.theme.fontSans};`,
      `  --font-mono: ${data.theme.fontMono};`,
      '',
      ...colorLines,
      '',
      '  --radius-sm: calc(var(--radius) - 4px);',
      '  --radius-md: calc(var(--radius) - 2px);',
      '  --radius-lg: var(--radius);',
      '  --radius-xl: calc(var(--radius) + 4px);',
      '  --radius-2xl: calc(var(--radius) + 10px);',
      '}',
      '',
    ].join('\n'),
  ])
}

export function renderIndexJs(manifest) {
  return joinSections([
    '/* Generated from src/tokens.json. Run pnpm --filter @fish-admin/tokens build. */\n',
    `export const manifest = ${JSON.stringify(manifest, null, 2)}\n`,
    'export const tokens = manifest.tokens\n',
    'export const accents = manifest.accents\n',
    'export default manifest\n',
  ])
}

export function renderIndexDts() {
  return joinSections([
    '/* Generated from src/tokens.json. Run pnpm --filter @fish-admin/tokens build. */\n',
    "import type { AccentDefinition, ThemeManifest, TokenDefinition } from './editor/types.js'\n",
    "export type { AccentDefinition, HighContrastValues, LocalizedText, ThemeManifest, ThemeSnapshot, TokenDefinition, TokenGroup, TokenType } from './editor/types.js'\n",
    'export declare const manifest: ThemeManifest\n',
    'export declare const tokens: TokenDefinition[]\n',
    'export declare const accents: AccentDefinition[]\n',
    'declare const _default: ThemeManifest\n',
    'export default _default\n',
  ])
}

export function generateArtifacts(data, version) {
  validateSource(data)
  const manifest = buildManifest(data, version)
  const files = new Map([
    ['tokens.css', renderTokensCss(data)],
    ['theme.css', renderThemeCss(data)],
    ['manifest.json', `${JSON.stringify(manifest, null, 2)}\n`],
    ['tokens.json', `${JSON.stringify(data, null, 2)}\n`],
    ['index.js', renderIndexJs(manifest)],
    ['index.d.ts', renderIndexDts()],
  ])
  return { files, manifest }
}

export function countDeclarations(css) {
  return [...css.matchAll(/^\s*(--[a-z][a-z0-9-]*)\s*:/gm)].map((match) => match[1])
}
