import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty'

function NoProjects() {
  return (
    <Empty data-testid="empty" variant="outline">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <svg aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No projects yet</EmptyTitle>
        <EmptyDescription>Create your first project to get started.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <button type="button">Create project</button>
      </EmptyContent>
    </Empty>
  )
}

describe('Empty', () => {
  it('renders the title, description and action', () => {
    render(<NoProjects />)

    const empty = screen.getByTestId('empty')

    expect(empty).toHaveAttribute('data-slot', 'empty')
    expect(empty).toHaveAttribute('data-variant', 'outline')
    expect(empty).toHaveClass('border-dashed')
    expect(screen.getByText('No projects yet')).toHaveAttribute('data-slot', 'empty-title')
    expect(screen.getByText('Create your first project to get started.')).toHaveAttribute(
      'data-slot',
      'empty-description',
    )
    expect(screen.getByRole('button', { name: 'Create project' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Create project' }).parentElement).toHaveAttribute(
      'data-slot',
      'empty-content',
    )
  })

  it('defaults to the plain variant', () => {
    render(
      <Empty data-testid="empty">
        <EmptyTitle>Nothing here</EmptyTitle>
      </Empty>,
    )

    const empty = screen.getByTestId('empty')

    expect(empty).toHaveAttribute('data-variant', 'default')
    expect(empty).not.toHaveClass('border-dashed')
  })
})
