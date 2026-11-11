import { beforeEach, describe, expect, it } from 'vitest'

import { i18nReady, language, setLanguage, useT } from './i18n'

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
})
