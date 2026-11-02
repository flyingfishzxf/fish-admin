import type { ThemeManifest, ThemeSnapshot, TokenType } from './types'
import { isValidValueForType } from './validate'

function sanitizeValues(
  input: unknown,
  specs: ReadonlyMap<string, TokenType>,
  allowed: ReadonlySet<string>,
): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}

  const values: Record<string, string> = {}
  for (const [token, value] of Object.entries(input as Record<string, unknown>)) {
    const type = specs.get(token)
    if (!type || typeof value !== 'string') continue
    const trimmed = value.trim()
    if (!isValidValueForType(type, trimmed, allowed)) continue
    values[token] = trimmed
  }
  return values
}

export function sanitizeTheme(
  input: unknown,
  manifest: Pick<ThemeManifest, 'tokens'>,
): ThemeSnapshot {
  const specs = new Map(manifest.tokens.map((token) => [token.cssVar, token.type]))
  const allowed = new Set(specs.keys())
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}

  return {
    light: sanitizeValues(source.light, specs, allowed),
    dark: sanitizeValues(source.dark, specs, allowed),
  }
}
