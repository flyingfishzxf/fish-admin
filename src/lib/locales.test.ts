import { describe, expect, it } from 'vitest'

import { ALL_NAV_ITEMS, NAV_GROUPS } from '@/config/nav'
import { PERMISSIONS, PERMISSION_GROUPS } from '@/config/permissions'

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

const LOCALES = [...locales.keys()].sort()

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
  it('loads every locale with the same namespaces', () => {
    expect(LOCALES.length).toBeGreaterThan(0)

    const reference = [...(locales.get(LOCALES[0])?.keys() ?? [])].sort()
    expect(reference.length, `no namespaces in ${LOCALES[0]}`).toBeGreaterThan(0)

    for (const locale of LOCALES) {
      const namespaces = [...(locales.get(locale)?.keys() ?? [])].sort()

      expect(namespaces.length, `no namespaces in ${locale}`).toBeGreaterThan(0)
      expect(namespaces, `namespace drift in ${locale}`).toEqual(reference)
    }
  })

  it('keeps translation keys in sync between languages', () => {
    const reference = locales.get(LOCALES[0])

    for (const [locale, namespaces] of locales) {
      if (locale === LOCALES[0]) continue

      for (const [namespace, keys] of reference ?? []) {
        const other = namespaces.get(namespace)

        expect(other, `missing namespace: ${locale}/${namespace}`).toBeDefined()
        expect(flattenKeys(other).sort(), `namespace: ${locale}/${namespace}`).toEqual(
          flattenKeys(keys).sort(),
        )
      }
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
    for (const language of LOCALES) {
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
    for (const language of LOCALES) {
      for (const group of PERMISSION_GROUPS) {
        const key = `permissions:groups.${group}`
        expect(lookup(language, key), key).toEqual(expect.any(String))
      }
    }
  })

  it('translates every navigation title', () => {
    for (const language of LOCALES) {
      for (const group of NAV_GROUPS) {
        expect(lookup(language, group.titleKey), group.titleKey).toEqual(expect.any(String))
      }
      for (const item of ALL_NAV_ITEMS) {
        expect(lookup(language, item.titleKey), item.titleKey).toEqual(expect.any(String))
      }
    }
  })
})
