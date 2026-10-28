import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  PLAN_STEPS,
  PLAN_VARIANTS,
  buildOptions,
  checkPlan,
  discoverLocales,
  optionsFromFlags,
  parseFlags,
  slugToDisplayName,
  validateSlug,
} from './scaffold.mjs'

function flags(argv, locales) {
  return buildOptions(optionsFromFlags(parseFlags(argv), locales, 'my-admin'))
}

// The scaffold rewrites the template through literal anchors. No other suite
// notices when a targeted file is reformatted, so this is what keeps
// `pnpm scaffold` from shipping a product that fails its own gates.
//
// `.scaffold.json` marks a directory that was already transformed: its anchors
// are gone by design, so the plan checks belong to the template, not the product.
const isTemplate = !existsSync(join(process.cwd(), '.scaffold.json'))

describe.skipIf(!isTemplate)('scaffold plan', () => {
  const root = process.cwd()

  for (const variant of PLAN_VARIANTS) {
    it(`matches the template when ${variant.label}`, () => {
      expect(() => checkPlan(root, variant.overrides)).not.toThrow()
    })
  }

  it('gives every step a title the run summary can print', () => {
    for (const step of PLAN_STEPS) {
      expect(step.title.length).toBeGreaterThan(0)
      expect(typeof step.when).toBe('function')
    }
  })

  it('keeps the fallback locale out of reach', () => {
    const locales = discoverLocales(root)
    expect(locales).toContain('en')

    expect(() => flags(['--name=acme', '--locales=zh-CN'], locales)).toThrow(/locale is required/)
    expect(() => flags(['--name=acme', '--locales=fr'], locales)).toThrow(/unknown locale/)
  })
})

describe('scaffold options', () => {
  it('derives a display name from the package name', () => {
    expect(slugToDisplayName('acme-console')).toBe('Acme Console')
    expect(slugToDisplayName('ops_hub')).toBe('Ops Hub')
  })

  it('rejects the names npm rejects', () => {
    expect(validateSlug('acme-console')).toBeNull()
    expect(validateSlug('Acme')).toMatch(/lowercase/)
    expect(validateSlug('.hidden')).toMatch(/dot/)
  })

  it('refuses flags it does not know', () => {
    expect(() => parseFlags(['--catelog=strip'])).toThrow(/Unknown flag/)
    expect(() => parseFlags(['--name'])).toThrow(/needs a value/)
    expect(() => parseFlags(['--yes=true'])).toThrow(/does not take a value/)
    expect(parseFlags(['--yes', '--mock=drop'])).toEqual({ mock: 'drop', yes: true })
  })

  it('refuses a value that is not on the menu', () => {
    expect(() => flags(['--name=acme', '--mock=remove'], ['en'])).toThrow(
      /--mock=remove is not one of/,
    )
  })

  it('keeps every locale when --locales is absent', () => {
    const options = flags(['--name=acme', '--yes'], ['en', 'zh-CN'])
    expect(options.keptLocales).toEqual(['en', 'zh-CN'])
    expect(options.droppedLocales).toEqual([])
    expect(options.keepMock).toBe(true)
  })

  it('drops the locales the adopter did not choose', () => {
    const options = flags(['--name=acme', '--yes', '--locales=en'], ['en', 'zh-CN'])
    expect(options.keptLocales).toEqual(['en'])
    expect(options.droppedLocales).toEqual(['zh-CN'])
  })

  it('reads --mock=drop as a removal', () => {
    const options = flags(['--name=acme', '--yes', '--mock=drop'], ['en'])
    expect(options.keepMock).toBe(false)
  })

  it('falls back to the directory name when --name is absent', () => {
    expect(flags(['--yes'], ['en']).slug).toBe('my-admin')
  })
})
