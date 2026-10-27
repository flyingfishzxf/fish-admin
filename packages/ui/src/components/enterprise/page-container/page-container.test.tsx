import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageContainer } from './page-container'
import { Button } from '../../ui/button'

describe('PageContainer', () => {
  it('renders the header, actions, tabs, content, and footer', () => {
    render(
      <PageContainer
        title="Team members"
        description="Manage who can access this workspace."
        eyebrow="Workspace"
        actions={<Button type="button">Invite</Button>}
        tabs={
          <div role="tablist" aria-label="Member views">
            All members
          </div>
        }
        footer={<p>Footer note</p>}
      >
        <p>Page content</p>
      </PageContainer>,
    )

    expect(screen.getByRole('heading', { name: 'Team members' })).toBeInTheDocument()
    expect(screen.getByText('Manage who can access this workspace.')).toBeInTheDocument()
    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Member views' })).toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
    expect(screen.getByText('Footer note')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="page-container"]')).toBeInTheDocument()
  })

  it('marks the tabs row as sticky when requested', () => {
    render(
      <PageContainer title="Audit log" tabs={<div>Filter tabs</div>} stickyHeader>
        <p>Entries</p>
      </PageContainer>,
    )

    const tabs = document.querySelector('[data-slot="page-container-tabs"]')
    expect(tabs).toHaveClass('sticky', 'top-0', 'z-10', 'bg-background/95', 'backdrop-blur')

    expect(screen.getByText('Filter tabs')).toBeInTheDocument()
  })
})
