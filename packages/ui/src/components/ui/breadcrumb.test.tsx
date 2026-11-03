import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'

function BreadcrumbHarness() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Settings</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

describe('Breadcrumb', () => {
  it('labels the navigation and marks the current page', () => {
    render(<BreadcrumbHarness />)

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })

    expect(nav).toHaveAttribute('data-slot', 'breadcrumb')
    expect(within(nav).getByRole('list')).toHaveAttribute('data-slot', 'breadcrumb-list')
    expect(nav.querySelectorAll('[data-slot="breadcrumb-item"]')).toHaveLength(3)
    expect(nav.querySelectorAll('[data-slot="breadcrumb-separator"]')).toHaveLength(2)
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects')

    const current = within(nav).getByRole('link', { name: 'Settings' })

    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current).toHaveAttribute('aria-disabled', 'true')
    expect(current).toHaveAttribute('data-slot', 'breadcrumb-page')
  })

  it('allows the navigation label to be overridden', () => {
    render(
      <Breadcrumb aria-label="You are here">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    expect(screen.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument()
  })
})
