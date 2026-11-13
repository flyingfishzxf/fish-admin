import { beforeEach, describe, expect, it } from 'vitest'

import { i18n, i18nReady, language, REQUIRED_NAMESPACES, setLanguage, useT } from './i18n'

describe('i18n', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    localStorage.clear()
  })

  it('updates the ref, html lang and persistence key on change', async () => {
    await setLanguage('zh-CN')
    expect(language.value).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(localStorage.getItem('fish-admin:lang')).toBe('zh-CN')
  })

  it('re-renders translations from the language ref', async () => {
    const t = useT('common')
    expect(t('actions.save')).toBe('Save')
    await setLanguage('zh-CN')
    expect(t('actions.save')).toBe('保存')
  })

  it('overrides the shared React wording with the Vue wording', () => {
    const t = useT('common')
    expect(t('app.tagline')).toBe('A modern admin starter for Vue teams')
  })

  it('loads real translations for every namespace a shipped page can read', async () => {
    await i18nReady
    expect(REQUIRED_NAMESPACES).toEqual([
      'auth',
      'dashboard',
      'users',
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
    ])

    // `hasLoadedNamespace` also returns true when a backend load failed, so a
    // misspelled namespace or a missing JSON would pass that check. Assert that
    // both languages really contain translations instead.
    await setLanguage('en')
    for (const namespace of REQUIRED_NAMESPACES) {
      expect(Object.keys(i18n.getResourceBundle('en', namespace) ?? {})).not.toHaveLength(0)
    }
    await setLanguage('zh-CN')
    for (const namespace of REQUIRED_NAMESPACES) {
      expect(Object.keys(i18n.getResourceBundle('zh-CN', namespace) ?? {})).not.toHaveLength(0)
    }
  })
})
