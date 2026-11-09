import i18n, { type Module } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'

import { nextLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from './languages'
import { EAGER_NAMESPACES, RESOURCES } from './resources'

export { EAGER_NAMESPACES, nextLanguage, SUPPORTED_LANGUAGES }
export type { SupportedLanguage }

const lazyResources = import.meta.glob('../locales/*/*.json')
let storageKey = 'fish-admin:lang'

function resolveInitialLanguage(): SupportedLanguage {
  const codes = SUPPORTED_LANGUAGES.map((language) => language.code)
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey)
  if (stored && codes.includes(stored as SupportedLanguage)) return stored as SupportedLanguage

  // A browser asking for `zh-TW` still gets `zh-CN` if that is what the app
  // ships, so the match is on the primary subtag.
  const browser = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase()
  const match = SUPPORTED_LANGUAGES.find((language) =>
    browser.startsWith(language.code.toLowerCase().split('-')[0]),
  )

  return (match?.code ?? codes[0]) as SupportedLanguage
}

/** The language on screen, clamped to one this build actually ships. */
export function currentLanguage(): SupportedLanguage {
  const resolved = i18n.resolvedLanguage
  return (SUPPORTED_LANGUAGES.find((language) => language.code === resolved)?.code ??
    SUPPORTED_LANGUAGES[0].code) as SupportedLanguage
}

export function ensureNamespaces(namespaces: string | string[]) {
  return i18n.loadNamespaces(namespaces)
}

export async function changeLanguage(language: SupportedLanguage) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey, language)
  await i18n.changeLanguage(language)
}

export interface SetupI18nOptions {
  plugins?: Module[]
  storageKey: string
}

export function setupI18n({ plugins = [], storageKey: key }: SetupI18nOptions) {
  storageKey = key
  for (const plugin of plugins) i18n.use(plugin)

  i18n.use(
    resourcesToBackend((language: string, namespace: string) => {
      const loader = lazyResources[`../locales/${language}/${namespace}.json`]
      if (!loader) {
        return Promise.reject(new Error(`Missing locale resource: ${language}/${namespace}`))
      }
      return loader()
    }),
  )

  const initialLanguage = resolveInitialLanguage()
  const ready = i18n.init({
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((language) => language.code),
    ns: [...EAGER_NAMESPACES],
    defaultNS: 'common',
    resources: RESOURCES,
    partialBundledLanguages: true,
    interpolation: { escapeValue: false },
    returnNull: false,
  })

  i18n.on('languageChanged', (language) => {
    if (typeof document !== 'undefined') document.documentElement.lang = language
  })
  if (typeof document !== 'undefined') document.documentElement.lang = initialLanguage

  return {
    i18n,
    ready,
    initialLanguage,
    changeLanguage,
    ensureNamespaces,
    currentLanguage,
    nextLanguage,
  }
}
