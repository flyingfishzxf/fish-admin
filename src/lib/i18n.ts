import { initReactI18next } from 'react-i18next'

import {
  changeLanguage,
  currentLanguage,
  ensureNamespaces,
  nextLanguage,
  setupI18n,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@fish-admin/i18n'

const { ready } = setupI18n({
  plugins: [initReactI18next],
  storageKey: 'fish-admin:lang',
})

export const i18nReady = ready
export { changeLanguage, currentLanguage, ensureNamespaces, nextLanguage, SUPPORTED_LANGUAGES }
export type { SupportedLanguage }
