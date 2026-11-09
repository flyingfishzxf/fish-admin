export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']

/**
 * The other language the app ships, or `undefined` when only one is installed —
 * then the shell hides its language switches instead of switching to the current
 * one. `scripts/scaffold.mjs` removes locale entries, so this cannot be a
 * hard-coded pair.
 */
export function nextLanguage(current: string | undefined): SupportedLanguage | undefined {
  if (SUPPORTED_LANGUAGES.length < 2) return undefined
  return SUPPORTED_LANGUAGES.find((language) => language.code !== current)?.code
}
