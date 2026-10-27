import { createRouter } from '@tanstack/react-router'

import { describe, expect, it } from 'vitest'

import * as ui from '@fish-admin/react'

import {
  CATALOG_DEMOS,
  CATALOG_DEMO_IDS,
} from '@/features/playground/components/component-catalog-demo-map'
import enCatalog from '@/locales/en/catalog.json'
import zhCatalog from '@/locales/zh-CN/catalog.json'
import { routeTree } from '@/routeTree.gen'

import {
  COMPONENTS,
  COMPONENT_CATEGORIES,
  COMPONENT_COUNTS,
  COMPONENT_IMPORT_PATH,
  DEMOED_COMPONENTS,
} from './components'

const router = createRouter({ routeTree })

// Registry ids -> package export names; these four ids do not map by PascalCase.
const EXPORT_NAME_OVERRIDES: Record<string, string> = {
  chart: 'ChartContainer',
  'input-otp': 'InputOTP',
  resizable: 'ResizablePanelGroup',
  sonner: 'Toaster',
}

function componentExportName(id: string) {
  return (
    EXPORT_NAME_OVERRIDES[id] ??
    id
      .split('-')
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join('')
  )
}
const NEW_ROUTES = [
  '/projects',
  '/projects/$id',
  '/reports',
  '/files',
  '/notifications',
  '/integrations',
  '/workflows',
  '/workflows/$id',
  '/dictionaries',
]

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

  it('publishes every component from the shared package', () => {
    expect(COMPONENT_IMPORT_PATH).toBe('@fish-admin/react')

    const packageExports = ui as Record<string, unknown>
    for (const entry of COMPONENTS) {
      const exportName = componentExportName(entry.id)
      expect(packageExports[exportName], `${entry.id} should export ${exportName}`).toBeTruthy()
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

  it('gives every component a live catalog demo', () => {
    const ids = COMPONENTS.map((entry) => entry.id)

    expect(DEMOED_COMPONENTS).toHaveLength(83)
    expect(new Set(CATALOG_DEMO_IDS)).toEqual(new Set(ids))
    expect(CATALOG_DEMO_IDS).toHaveLength(83)

    for (const entry of COMPONENTS) {
      expect(entry.demo, `${entry.id} demo link`).toBe(`/components#demo-${entry.id}`)
      expect(CATALOG_DEMOS[entry.id], `${entry.id} demo component`).toBeTypeOf('function')
    }
  })

  it('badges the newest component wave', () => {
    expect(COMPONENTS.filter((entry) => entry.isNew)).toHaveLength(33)
  })

  it('points every component at a real business route', () => {
    for (const entry of COMPONENTS) {
      const route = entry.usedIn
      expect(route, `${entry.id} usedIn`).toBeTruthy()
      expect(route.startsWith('/'), `${entry.id} should use an absolute route`).toBe(true)
      expect(route, `${entry.id} should not point at the catalog`).not.toMatch(
        /^\/(components|ui)(\/|$)/,
      )

      const path = route.split(/[?#]/)[0]
      const routeIds = router.matchRoutes(path).map((match) => match.routeId)
      expect(routeIds.length, `${entry.id} usedIn ${path} should resolve`).toBeGreaterThan(0)
      expect(routeIds, `${entry.id} usedIn ${path} should not fall through`).not.toContain(
        '/_app/$',
      )
    }
  })

  it('surfaces the nine demo business screens in the catalog', () => {
    for (const route of NEW_ROUTES) {
      expect(
        COMPONENTS.filter((entry) => entry.usedIn === route).length,
        `${route} should have at least one component`,
      ).toBeGreaterThan(0)
    }
  })
})
