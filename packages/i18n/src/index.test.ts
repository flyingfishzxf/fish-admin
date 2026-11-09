import { describe, expect, it } from 'vitest'

import {
  changeLanguage,
  currentLanguage,
  EAGER_NAMESPACES,
  nextLanguage,
  setupI18n,
  SUPPORTED_LANGUAGES,
} from './index'
import { RESOURCES } from './resources'

describe('i18n resources', () => {
  it('ships every declared language', () => {
    expect(Object.keys(RESOURCES).sort()).toEqual(
      SUPPORTED_LANGUAGES.map((language) => language.code).sort(),
    )
  })

  it('ships every eager namespace', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(Object.keys(RESOURCES[language.code]).sort()).toEqual([...EAGER_NAMESPACES].sort())
    }
  })

  it('picks the other installed language', () => {
    expect(nextLanguage('en')).toBe('zh-CN')
    expect(nextLanguage('zh-CN')).toBe('en')
  })
})

describe('setupI18n', () => {
  it('initialises from the storage key and switches language', async () => {
    localStorage.setItem('test:lang', 'zh-CN')
    const configured = setupI18n({ storageKey: 'test:lang' })
    await configured.ready

    expect(currentLanguage()).toBe('zh-CN')
    await changeLanguage('en')
    expect(currentLanguage()).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })
})
