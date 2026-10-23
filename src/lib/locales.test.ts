import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ALL_NAV_ITEMS, NAV_GROUPS } from '@/config/nav'
import { PERMISSIONS, PERMISSION_GROUPS } from '@/config/permissions'

const CATALOG_DEMO_FILES = [
  'src/features/playground/components/component-catalog-demos.tsx',
  'src/features/playground/components/component-catalog-demos-wave2.tsx',
  'src/features/playground/components/component-catalog-demos-wave3.tsx',
]

type JsonObject = Record<string, unknown>

const resources = import.meta.glob('../locales/*/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, JsonObject>

const locales = new Map<string, Map<string, JsonObject>>()

for (const [path, resource] of Object.entries(resources)) {
  const [, language, namespace] = path.match(/\.\.\/locales\/([^/]+)\/([^/]+)\.json$/) ?? []
  if (!language || !namespace) continue

  if (!locales.has(language)) locales.set(language, new Map())
  locales.get(language)?.set(namespace, resource)
}

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix]
  }

  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  )
}

function lookup(language: string, key: string): unknown {
  const [namespace] = key.split(':')
  const resource = locales.get(language)?.get(namespace)
  if (!resource) return undefined

  return key
    .slice(namespace.length + 1)
    .split('.')
    .reduce<unknown>((value, segment) => {
      if (value && typeof value === 'object' && segment in value) {
        return (value as JsonObject)[segment]
      }
      return undefined
    }, resource)
}

describe('locale resources', () => {
  it('loads both languages with the same namespaces', () => {
    expect([...locales.keys()].sort()).toEqual(['en', 'zh-CN'])

    const enNamespaces = [...(locales.get('en')?.keys() ?? [])].sort()
    const zhNamespaces = [...(locales.get('zh-CN')?.keys() ?? [])].sort()

    expect(zhNamespaces).toEqual(enNamespaces)
    expect(enNamespaces.length).toBeGreaterThan(0)
  })

  it('keeps translation keys in sync between languages', () => {
    for (const [namespace, resource] of locales.get('en') ?? []) {
      const zhResource = locales.get('zh-CN')?.get(namespace)

      expect(zhResource, `missing namespace: ${namespace}`).toBeDefined()
      expect(flattenKeys(zhResource).sort(), `namespace: ${namespace}`).toEqual(
        flattenKeys(resource).sort(),
      )
    }
  })

  it('never leaves an empty translation string', () => {
    function assertStrings(value: unknown, path: string) {
      if (typeof value === 'string') {
        expect(value.trim(), path).not.toBe('')
        return
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [key, child] of Object.entries(value)) {
          assertStrings(child, `${path}.${key}`)
        }
        return
      }

      throw new Error(`${path} is not a translation string`)
    }

    for (const [language, namespaces] of locales) {
      for (const [namespace, resource] of namespaces) {
        assertStrings(resource, `${language}/${namespace}`)
      }
    }
  })

  it('translates every permission label and description', () => {
    for (const language of ['en', 'zh-CN']) {
      for (const permission of PERMISSIONS) {
        expect(lookup(language, permission.labelKey), permission.labelKey).toEqual(
          expect.any(String),
        )
        expect(lookup(language, permission.descriptionKey), permission.descriptionKey).toEqual(
          expect.any(String),
        )
      }
    }
  })

  it('translates every permission group', () => {
    for (const language of ['en', 'zh-CN']) {
      for (const group of PERMISSION_GROUPS) {
        const key = `permissions:groups.${group}`
        expect(lookup(language, key), key).toEqual(expect.any(String))
      }
    }
  })

  it('translates every literal key used by the catalog demos', () => {
    for (const file of CATALOG_DEMO_FILES) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8')

      for (const match of source.matchAll(/\bt\('(catalog:[^']+)'/g)) {
        const key = match[1]
        for (const language of ['en', 'zh-CN']) {
          expect(lookup(language, key), `${file}: ${key}`).toEqual(expect.any(String))
        }
      }
    }
  })

  it('translates every navigation title', () => {
    for (const language of ['en', 'zh-CN']) {
      for (const group of NAV_GROUPS) {
        expect(lookup(language, group.titleKey), group.titleKey).toEqual(expect.any(String))
      }
      for (const item of ALL_NAV_ITEMS) {
        expect(lookup(language, item.titleKey), item.titleKey).toEqual(expect.any(String))
      }
    }
  })
})
