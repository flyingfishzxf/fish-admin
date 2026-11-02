import {
  decodeTheme,
  encodeTheme,
  sanitizeTheme,
  type AccentDefinition,
  type ThemeManifest,
  type ThemeSnapshot,
  type TokenDefinition,
} from '@fish-admin/tokens/editor'

export type ThemeMode = 'light' | 'dark'

export interface TokenOverrides {
  light: Record<string, string>
  dark: Record<string, string>
}

export interface StoredTheme {
  accent: string
  overrides: TokenOverrides
  highContrast: boolean
}

export function emptyOverrides(): TokenOverrides {
  return { light: {}, dark: {} }
}

export function defaultAccentId(manifest: ThemeManifest): string {
  return (manifest.accents.find((accent) => accent.default) ?? manifest.accents[0]).id
}

export function isSharedToken(token: TokenDefinition): boolean {
  return token.dark === undefined
}

export function baseValue(token: TokenDefinition, mode: ThemeMode): string {
  return mode === 'dark' && token.dark ? token.dark : token.light
}

function accentValue(
  accent: AccentDefinition | undefined,
  token: TokenDefinition,
  mode: ThemeMode,
): string | undefined {
  if (!accent || token.type !== 'color') return undefined
  const values = mode === 'light' ? accent.light : accent.dark
  return values?.[token.cssVar]
}

export function highContrastValue(
  accent: AccentDefinition | undefined,
  token: TokenDefinition,
  mode: ThemeMode,
): string | undefined {
  if (token.type !== 'color') return undefined
  const accentValues = mode === 'light' ? accent?.highContrastLight : accent?.highContrastDark
  return accentValues?.[token.cssVar] ?? token.highContrast?.[mode]
}

export function effectiveValue(
  token: TokenDefinition,
  mode: ThemeMode,
  overrides: TokenOverrides,
  accent: AccentDefinition | undefined,
  highContrast: boolean,
): string {
  const shared = isSharedToken(token)
  const override =
    overrides[mode]?.[token.cssVar] ?? (shared ? overrides.light[token.cssVar] : undefined)
  if (override) return override
  if (highContrast) {
    const highContrastToken = highContrastValue(accent, token, mode)
    if (highContrastToken) return highContrastToken
  }
  const accentToken = accentValue(accent, token, mode)
  if (accentToken) return accentToken
  return baseValue(token, mode)
}

export function effectiveValues(
  manifest: ThemeManifest,
  mode: ThemeMode,
  overrides: TokenOverrides,
  accent: AccentDefinition | undefined,
  highContrast: boolean,
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const token of manifest.tokens) {
    values[token.cssVar] = effectiveValue(token, mode, overrides, accent, highContrast)
  }
  return values
}

export function previewValues(
  manifest: ThemeManifest,
  mode: ThemeMode,
  overrides: TokenOverrides,
  accent: AccentDefinition | undefined,
  highContrast: boolean,
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const token of manifest.tokens) {
    const value = effectiveValue(token, mode, overrides, accent, highContrast)
    if (value !== baseValue(token, mode)) values[token.cssVar] = value
  }
  return values
}

export function highContrastValues(
  manifest: ThemeManifest,
  accent: AccentDefinition | undefined,
  mode: ThemeMode,
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const token of manifest.tokens) {
    const value = highContrastValue(accent, token, mode)
    if (value) values[token.cssVar] = value
  }
  return values
}

export function accentTokenVars(manifest: ThemeManifest): Set<string> {
  const variables = new Set<string>()
  for (const accent of manifest.accents) {
    for (const values of [
      accent.light,
      accent.dark,
      accent.highContrastLight,
      accent.highContrastDark,
    ]) {
      for (const cssVar of Object.keys(values ?? {})) variables.add(cssVar)
    }
  }
  return variables
}

export function withoutTokens(
  values: Record<string, string>,
  tokens: ReadonlySet<string>,
): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([cssVar]) => !tokens.has(cssVar)))
}

export function encodeStoredTheme(theme: StoredTheme): string {
  const payload: ThemeSnapshot & { accent: string; highContrast: boolean } = {
    accent: theme.accent,
    highContrast: theme.highContrast,
    light: theme.overrides.light,
    dark: theme.overrides.dark,
  }
  return encodeTheme(payload)
}

export function decodeStoredTheme(
  raw: string | null | undefined,
  manifest: ThemeManifest,
): StoredTheme | null {
  const decoded = decodeTheme(raw)
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return null
  const record = decoded as Record<string, unknown>
  const accent =
    typeof record.accent === 'string' && manifest.accents.some((item) => item.id === record.accent)
      ? record.accent
      : defaultAccentId(manifest)
  return {
    accent,
    overrides: sanitizeTheme(record, manifest),
    highContrast: record.highContrast === true,
  }
}
