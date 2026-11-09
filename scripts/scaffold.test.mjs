import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  PLAN_STEPS,
  PLAN_VARIANTS,
  applyPlan,
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

  it('drops the parity gate together with the mock package', () => {
    const options = flags(['--name=acme', '--yes', '--mock=drop'], discoverLocales(root))
    const { editor } = applyPlan({ root, options, check: true })

    const ci = editor.buffers.get('.github/workflows/ci.yml')
    expect(ci).not.toContain('check:parity:freeze')
    expect(ci).not.toContain('check:parity:contract')
    expect(ci).not.toContain('check:parity:scenarios')
    expect(ci.split('\n').some((line) => line.startsWith('  parity:'))).toBe(false)

    // The mock-free jobs leave; the docs jobs survive because the docs suites
    // render static demos and never touch the mock API.
    const lines = ci.split('\n')
    for (const job of ['  e2e:', '  visual:', '  docs-visual:', '  parity:']) {
      expect(lines.some((line) => line.startsWith(job))).toBe(false)
    }
    expect(lines.some((line) => line.startsWith('  docs:'))).toBe(true)
    expect(lines.some((line) => line.startsWith('  docs-e2e:'))).toBe(true)

    const pkg = JSON.parse(editor.buffers.get('package.json'))
    expect(pkg.scripts['test:mock']).toBeUndefined()
    expect(pkg.scripts.typecheck).not.toContain('@fish-admin/mock')
    expect(pkg.scripts['test:shared']).not.toContain('@fish-admin/mock')
    // `e2e-docs` and the docs Playwright configs stay, so their dependencies do too.
    expect(pkg.devDependencies['@playwright/test']).toBeDefined()
    expect(pkg.devDependencies['@axe-core/playwright']).toBeDefined()

    // The docs visual scripts survive --mock=drop, so every helper they call
    // must survive with them. A deleted helper is a MODULE_NOT_FOUND at runtime.
    const deleted = new Set(editor.deletions)
    const helpers = [...JSON.stringify(pkg.scripts).matchAll(/node (scripts\/[\w.-]+\.mjs)/g)]
    expect(helpers.length).toBeGreaterThan(0)
    for (const [, helper] of helpers) {
      expect(deleted.has(helper)).toBe(false)
      expect(existsSync(join(root, helper))).toBe(true)
    }
    expect(pkg.scripts['test:docs:visual']).toContain('check-visual-platform.mjs')
  })

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
