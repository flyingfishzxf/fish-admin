import i18n from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'

import enCommon from '@/locales/en/common.json'
import enErrors from '@/locales/en/errors.json'
import enNav from '@/locales/en/nav.json'
import zhCommon from '@/locales/zh-CN/common.json'
import zhErrors from '@/locales/zh-CN/errors.json'
import zhNav from '@/locales/zh-CN/nav.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']

/** The language on screen, clamped to one this build actually ships. */
export function currentLanguage(): SupportedLanguage {
  const resolved = i18n.resolvedLanguage
  return (SUPPORTED_LANGUAGES.find((language) => language.code === resolved)?.code ??
    SUPPORTED_LANGUAGES[0].code) as SupportedLanguage
}

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

const LANGUAGE_STORAGE_KEY = 'fish-admin:lang'
const lazyResources = import.meta.glob('../locales/*/*.json')

function resolveInitialLanguage(): SupportedLanguage {
  const codes = SUPPORTED_LANGUAGES.map((language) => language.code)
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored && codes.includes(stored as SupportedLanguage)) return stored as SupportedLanguage

  // A browser asking for `zh-TW` still gets `zh-CN` if that is what the app
  // ships, so the match is on the primary subtag.
  const browser = navigator.language.toLowerCase()
  const match = SUPPORTED_LANGUAGES.find((language) =>
    browser.startsWith(language.code.toLowerCase().split('-')[0]),
  )

  return (match?.code ?? codes[0]) as SupportedLanguage
}

const initialLanguage = resolveInitialLanguage()

i18n
  .use(
    resourcesToBackend((language: string, namespace: string) => {
      const loader = lazyResources[`../locales/${language}/${namespace}.json`]
      if (!loader) {
        return Promise.reject(new Error(`Missing locale resource: ${language}/${namespace}`))
      }
      return loader()
    }),
  )
  .use(initReactI18next)

export const i18nReady = i18n.init({
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES.map((language) => language.code),
  ns: ['common', 'nav', 'errors'],
  defaultNS: 'common',
  resources: {
    en: { common: enCommon, nav: enNav, errors: enErrors },
    'zh-CN': { common: zhCommon, nav: zhNav, errors: zhErrors },
  },
  partialBundledLanguages: true,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  returnNull: false,
})

export function ensureNamespaces(namespaces: string | string[]) {
  return i18n.loadNamespaces(namespaces)
}

export async function changeLanguage(language: SupportedLanguage) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  await i18n.changeLanguage(language)
}

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

document.documentElement.lang = initialLanguage
