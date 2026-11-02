import type { ThemeSnapshot } from './types.js'

const MAX_URL_LENGTH = 4096

export function encodeTheme(theme: ThemeSnapshot): string {
  const bytes = new TextEncoder().encode(JSON.stringify(theme))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeTheme(value: string | null | undefined): unknown {
  if (!value || value.length > MAX_URL_LENGTH) return null
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

export function themeToCss(theme: ThemeSnapshot): string {
  const blocks: string[] = []

  const light = Object.entries(theme.light)
  if (light.length) {
    blocks.push(
      [':root {', ...light.map(([token, value]) => `  ${token}: ${value};`), '}'].join('\n'),
    )
  }

  const dark = Object.entries(theme.dark)
  if (dark.length) {
    blocks.push(
      ['.dark {', ...dark.map(([token, value]) => `  ${token}: ${value};`), '}'].join('\n'),
    )
  }

  return `${blocks.join('\n\n')}\n`
}
