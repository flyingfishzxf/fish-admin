import { afterEach, describe, expect, it, vi } from 'vitest'

// `env` is read at module load, so each case re-imports the seam with its own
// stubbed variable instead of mutating a shared snapshot.
async function loadSite(docsUrl?: string) {
  vi.resetModules()
  if (docsUrl === undefined) vi.stubEnv('VITE_DOCS_URL', '')
  else vi.stubEnv('VITE_DOCS_URL', docsUrl)
  return import('@/config/site')
}

afterEach(() => vi.unstubAllEnvs())

describe('docs site seam', () => {
  it('offers no docs entry when the URL is unset', async () => {
    const { docsNavItem } = await loadSite()
    expect(docsNavItem()).toBeUndefined()
  })

  it('labels the entry through the nav namespace and opens a new tab', async () => {
    const { docsNavItem } = await loadSite('https://docs.acme.test')
    const item = docsNavItem()
    expect(item).toMatchObject({
      titleKey: 'nav:items.docs',
      href: 'https://docs.acme.test',
      external: true,
    })
  })

  it('maps the retired catalog routes onto the docs site', async () => {
    const { docsUrlFor } = await loadSite('https://docs.acme.test')
    expect(docsUrlFor('/components')).toBe('https://docs.acme.test/components')
    expect(docsUrlFor('/ui')).toBe('https://docs.acme.test/guide/theming')
    expect(docsUrlFor('/components/button')).toBeUndefined()
    expect(docsUrlFor('/users')).toBeUndefined()
  })

  it('maps nothing when there is no docs site to send anyone to', async () => {
    const { docsUrlFor } = await loadSite()
    expect(docsUrlFor('/components')).toBeUndefined()
  })
})
