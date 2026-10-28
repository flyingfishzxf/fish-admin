import { render, screen } from '@testing-library/react'
import { Boxes } from 'lucide-react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { NavItem } from '@/config/nav'
import { NavItemLink } from '@/components/layout/nav-item-link'

// The router is not under test here; the anchor semantics of the two branches
// is, so the internal branch renders through a stand-in that exposes `to` as
// the href a router would produce.
vi.mock('@tanstack/react-router', async () => {
  const { createElement } = await import('react')
  return {
    Link: ({ to, children, ...rest }: { to: string; children?: ReactNode }) =>
      createElement('a', { href: to, ...rest }, children),
  }
})

const internal: NavItem = { titleKey: 'nav:items.projects', to: '/projects', icon: Boxes }
const external: NavItem = {
  titleKey: 'nav:items.docs',
  href: 'https://docs.acme.test',
  icon: Boxes,
  external: true,
}

describe('NavItemLink', () => {
  it('routes an internal item through the router', () => {
    render(
      <NavItemLink item={internal} onNavigate={vi.fn()}>
        nav:items.projects
      </NavItemLink>,
    )

    const link = screen.getByRole('link', { name: 'nav:items.projects' })
    expect(link).toHaveAttribute('href', '/projects')
    expect(link).not.toHaveAttribute('target')
  })

  it('opens an external item in a new tab with a safe rel', () => {
    render(
      <NavItemLink item={external} onNavigate={vi.fn()}>
        nav:items.docs
      </NavItemLink>,
    )

    const link = screen.getByRole('link', { name: 'nav:items.docs' })
    expect(link).toHaveAttribute('href', 'https://docs.acme.test')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('forwards the class name both surfaces style the anchor with', () => {
    const { rerender } = render(
      <NavItemLink item={internal} className="chip">
        nav:items.projects
      </NavItemLink>,
    )
    expect(screen.getByRole('link')).toHaveClass('chip')

    rerender(
      <NavItemLink item={external} className="chip">
        nav:items.docs
      </NavItemLink>,
    )
    expect(screen.getByRole('link')).toHaveClass('chip')
  })
})
