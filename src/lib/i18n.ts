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

const LANGUAGE_STORAGE_KEY = 'fish-admin:lang'
const lazyResources = import.meta.glob('../locales/*/*.json')

function resolveInitialLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'en' || stored === 'zh-CN') return stored
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
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
