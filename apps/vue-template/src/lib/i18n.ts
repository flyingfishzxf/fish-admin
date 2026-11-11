import {
  currentLanguage,
  ensureNamespaces,
  nextLanguage,
  setupI18n,
  type SupportedLanguage,
} from '@fish-admin/i18n'
import type { TOptions } from 'i18next'
import { ref } from 'vue'

const setup = setupI18n({ storageKey: 'fish-admin:lang' })

export const i18n = setup.i18n
export const language = ref<SupportedLanguage>(setup.initialLanguage)
export const i18nReady = setup.ready.then(() =>
  ensureNamespaces(['auth', 'dashboard', 'users', 'validation']),
)

i18n.on('languageChanged', () => {
  language.value = currentLanguage()
})

export function setLanguage(next: SupportedLanguage) {
  return setup.changeLanguage(next)
}

export async function toggleLanguage() {
  const next = nextLanguage(language.value)
  if (next) await setLanguage(next)
}

export function useT(namespace?: string) {
  return (key: string, options?: TOptions) => {
    // Reading the ref registers the template's dependency on language changes.
    void language.value
    return i18n.t(key, namespace ? { ...options, ns: namespace } : options)
  }
}
