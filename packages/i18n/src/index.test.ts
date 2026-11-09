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
    const codes = SUPPORTED_LANGUAGES.map((language) => language.code)

    // A scaffolded product may keep a single locale; there is then nothing to
    // switch to and the shell hides its language switches.
    if (codes.length === 1) {
      expect(nextLanguage(codes[0])).toBeUndefined()
      return
    }

    for (const code of codes) {
      const other = nextLanguage(code)
      expect(other).toBeDefined()
      expect(codes).toContain(other)
      expect(other).not.toBe(code)
    }
  })
})

describe('setupI18n', () => {
  it('initialises from the storage key and switches language', async () => {
    const first = SUPPORTED_LANGUAGES[0].code
    const last = SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1].code

    localStorage.setItem('test:lang', last)
    const configured = setupI18n({ storageKey: 'test:lang' })
    await configured.ready

    expect(currentLanguage()).toBe(last)
    await changeLanguage(first)
    expect(currentLanguage()).toBe(first)
    expect(document.documentElement.lang).toBe(first)
  })
})
