export type TokenType = 'color' | 'length' | 'duration' | 'easing'

export interface LocalizedText {
  en: string
  zh: string
}

export interface HighContrastValues {
  light: string
  dark: string
}

export interface TokenDefinition {
  name: string
  cssVar: string
  type: TokenType
  group: string
  description: LocalizedText
  light: string
  dark?: string
  highContrast?: HighContrastValues
  editable: boolean
  tailwind?: string
}

export interface TokenGroup {
  id: string
  title: LocalizedText
  description: LocalizedText
}

export interface AccentDefinition {
  id: string
  label: LocalizedText
  default?: boolean
  light?: Record<string, string>
  dark?: Record<string, string>
  highContrastLight?: Record<string, string>
  highContrastDark?: Record<string, string>
}

export interface ThemeManifest {
  name: string
  version: string
  groups: TokenGroup[]
  tokens: TokenDefinition[]
  accents: AccentDefinition[]
  theme: {
    fontSans: string
    fontMono: string
  }
}

export interface ThemeSnapshot {
  light: Record<string, string>
  dark: Record<string, string>
}
