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

// Every namespace a shipped page can read must be loaded before the first
// render. Adding a page without adding its namespace here shows raw keys on a
// cold start, so `i18n.test.ts` asserts the whole list.
export const REQUIRED_NAMESPACES = [
  'auth',
  'dashboard',
  'users',
  'files',
  'projects',
  'workflows',
  'validation',
  'reports',
  'departments',
  'roles',
  'permissions',
  'dictionaries',
  'audit',
  'integrations',
  'profile',
  'security',
  'settings',
  'notifications',
] as const

// `packages/i18n` is shared with the React template, so a few strings name React
// or its tooling. The Vue app keeps the same keys and overrides just those
// values at boot, rather than forking the locale package or shipping a second
// copy of every namespace.
const APP_OVERRIDES: Record<SupportedLanguage, Record<string, Record<string, unknown>>> = {
  en: { common: { app: { tagline: 'A modern admin starter for Vue teams' } } },
  'zh-CN': { common: { app: { tagline: '为 Vue 团队打造的后台模板' } } },
}

export const i18nReady = setup.ready.then(async () => {
  await ensureNamespaces([...REQUIRED_NAMESPACES])
  for (const [code, bundles] of Object.entries(APP_OVERRIDES)) {
    for (const [namespace, bundle] of Object.entries(bundles)) {
      i18n.addResourceBundle(code, namespace, bundle, true, true)
    }
  }
})

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
