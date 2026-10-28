import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import * as ui from './index'

interface RegistryEntry {
  id: string
  name: string
  category: 'primitive' | 'enterprise' | 'pro'
  usedIn: string
  isNew?: boolean
}

// jsdom replaces the global URL, so `new URL('../registry.json', import.meta.url)`
// would resolve against the document base; join against the real module dir instead.
const registry = JSON.parse(readFileSync(join(import.meta.dirname, '../registry.json'), 'utf8'))
  .components as RegistryEntry[]

// Registry ids -> export names; these four ids do not map by PascalCase.
const EXPORT_NAME_OVERRIDES: Record<string, string> = {
  chart: 'ChartContainer',
  'input-otp': 'InputOTP',
  resizable: 'ResizablePanelGroup',
  sonner: 'Toaster',
}

function exportNameFor(id: string) {
  return (
    EXPORT_NAME_OVERRIDES[id] ??
    id
      .split('-')
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join('')
  )
}

describe('component registry', () => {
  it('tracks 83 shared components across three layers', () => {
    expect(registry).toHaveLength(83)
    const counts = registry.reduce(
      (acc, entry) => ({ ...acc, [entry.category]: (acc[entry.category] ?? 0) + 1 }),
      {} as Record<string, number>,
    )
    expect(counts).toEqual({ primitive: 47, enterprise: 30, pro: 6 })
  })

  it('keeps ids and names unique and kebab-cased', () => {
    const ids = registry.map((entry) => entry.id)
    const names = registry.map((entry) => entry.name)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    for (const entry of registry) expect(entry.name.trim()).not.toBe('')
  })

  it('publishes every component from the package barrel', () => {
    const exports = ui as Record<string, unknown>
    for (const entry of registry) {
      const name = exportNameFor(entry.id)
      expect(exports[name], `${entry.id} should export ${name}`).toBeTruthy()
    }
  })

  it('points every component at an absolute template route', () => {
    for (const entry of registry) {
      expect(entry.usedIn, `${entry.id} usedIn`).toBeTruthy()
      expect(entry.usedIn.startsWith('/'), `${entry.id} usedIn`).toBe(true)
      // The in-app catalog is gone; nothing may point at it again.
      expect(entry.usedIn, `${entry.id} usedIn`).not.toMatch(/^\/(components|ui)(\/|$)/)
    }
  })

  it('groups by layer and sorts by id so manifests stay stable', () => {
    const LAYER_ORDER = { primitive: 0, enterprise: 1, pro: 2 } as const
    const expected = [...registry].sort(
      (a, b) => LAYER_ORDER[a.category] - LAYER_ORDER[b.category] || a.id.localeCompare(b.id),
    )
    expect(registry.map((entry) => entry.id)).toEqual(expected.map((entry) => entry.id))
  })
})
