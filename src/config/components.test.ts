import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CATALOG_DEMO_IDS } from '@/features/playground/components/component-catalog-demo-map'
import enCatalog from '@/locales/en/catalog.json'
import zhCatalog from '@/locales/zh-CN/catalog.json'

import { COMPONENTS, COMPONENT_CATEGORIES, COMPONENT_COUNTS, DEMOED_COMPONENTS } from './components'

const ROOT = resolve(process.cwd())

function componentFile(id: string, category: (typeof COMPONENTS)[number]['category']) {
  if (category === 'primitive') return resolve(ROOT, `src/components/ui/${id}.tsx`)
  return resolve(ROOT, `src/components/${category}/${id}/${id}.tsx`)
}

describe('component registry', () => {
  it('tracks 83 shared components across three layers', () => {
    expect(COMPONENTS).toHaveLength(83)
    expect(COMPONENT_COUNTS).toEqual({ primitive: 47, enterprise: 30, pro: 6 })
    expect(COMPONENT_CATEGORIES).toEqual(['primitive', 'enterprise', 'pro'])
  })

  it('keeps ids and names unique and kebab-cased', () => {
    const ids = COMPONENTS.map((entry) => entry.id)
    const names = COMPONENTS.map((entry) => entry.name)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    for (const entry of COMPONENTS) expect(entry.name.trim()).not.toBe('')
  })

  it('points at a component file that exists', () => {
    for (const entry of COMPONENTS) {
      const file = componentFile(entry.id, entry.category)
      expect(existsSync(file), `${entry.id} should exist at ${file}`).toBe(true)
    }
  })

  it('ships an English and Chinese description for every component', () => {
    const enDescriptions = Object.keys(enCatalog.components)
    const zhDescriptions = Object.keys(zhCatalog.components)

    expect(new Set(enDescriptions)).toEqual(new Set(COMPONENTS.map((entry) => entry.id)))
    expect(zhDescriptions).toEqual(enDescriptions)

    for (const id of enDescriptions) {
      const en = (enCatalog.components as Record<string, { description: string }>)[id]
      const zh = (zhCatalog.components as Record<string, { description: string }>)[id]
      expect(en.description.trim(), `${id} en description`).not.toBe('')
      expect(zh.description.trim(), `${id} zh description`).not.toBe('')
    }
  })

  it('resolves every demo link to a real anchor', () => {
    const uiSource = readFileSync(
      resolve(ROOT, 'src/features/playground/components/ui-playground-page.tsx'),
      'utf8',
    )
    const catalogDemos = new Set<string>(CATALOG_DEMO_IDS)

    for (const entry of COMPONENTS) {
      if (!entry.demo) continue

      if (entry.demo.startsWith('/ui#')) {
        const anchor = entry.demo.split('#')[1]
        expect(uiSource, `${entry.id} anchor`).toContain(`id="${anchor}"`)
      } else if (entry.demo.startsWith('/components#')) {
        expect(catalogDemos.has(entry.id), `${entry.id} catalog demo`).toBe(true)
      } else {
        expect(entry.demo, `${entry.id} demo path`).toBe('/ui')
      }
    }
  })

  it('marks all thirty-three new components as demoed and keeps the coverage honest', () => {
    const newComponents = COMPONENTS.filter((entry) => entry.isNew)

    expect(newComponents).toHaveLength(33)
    for (const entry of newComponents) expect(entry.demo).toBeTruthy()
    expect(DEMOED_COMPONENTS).toHaveLength(68)
  })

  it('uses app-relative routes for usedIn hints', () => {
    for (const entry of COMPONENTS) {
      if (entry.usedIn) expect(entry.usedIn.startsWith('/')).toBe(true)
    }
  })
})
