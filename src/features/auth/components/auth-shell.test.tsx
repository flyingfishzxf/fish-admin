import { render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  // The keys are the assertion target: a missing label fails the locale test,
  // a wrong one fails here.
  useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage: 'en' } }),
}))

vi.mock('@/components/common/language-toggle', () => ({
  LanguageToggle: () => null,
}))

// `env` reads import.meta.env once at module load, so every case needs a fresh
// module graph with the variable already stubbed. An empty string is the unset
// case: `readHttpsUrl` treats blank as absent.
async function loadAuthShell(docsUrl: string) {
  vi.resetModules()
  vi.stubEnv('VITE_DOCS_URL', docsUrl)

  const { AuthShell } = await import('@/features/auth/components/auth-shell')
  return AuthShell
}

afterEach(() => {
  vi.unstubAllEnvs()
})

function renderShell(Shell: Awaited<ReturnType<typeof loadAuthShell>>) {
  render(
    <Shell title="Sign in" subtitle="Demo">
      <p>form</p>
    </Shell>,
  )
}

beforeAll(async () => {
  // The first dynamic import of the shell graph costs seconds of transform on a
  // cold cache, which is enough to blow the 5 s per-test budget when the whole
  // suite runs in parallel. Pay it once here instead.
  await loadAuthShell('')
})

describe('AuthShell docs link', () => {
  it('renders nothing docs-related without a configured site', async () => {
    renderShell(await loadAuthShell(''))

    expect(screen.queryByRole('link', { name: 'brand.docs' })).toBeNull()
    expect(screen.queryByText('https://docs.acme.test')).toBeNull()
  })

  it('links the docs site in a new tab', async () => {
    renderShell(await loadAuthShell('https://docs.acme.test'))

    const link = screen.getByRole('link', { name: 'brand.docs' })
    expect(link).toHaveAttribute('href', 'https://docs.acme.test')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('always states the client-side RBAC caveat', async () => {
    renderShell(await loadAuthShell('https://docs.acme.test'))

    expect(screen.getByText('demo.disclaimer')).toBeVisible()
  })
})
