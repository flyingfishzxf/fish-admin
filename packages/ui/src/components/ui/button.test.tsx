import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'

describe('Button', () => {
  it('maps variant and size props to the documented classes', () => {
    render(
      <>
        <Button>Save</Button>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
        <Button variant="outline" size="icon" aria-label="Open settings" />
      </>,
    )

    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toHaveAttribute('data-variant', 'default')
    expect(save).toHaveAttribute('data-size', 'default')
    expect(save).toHaveClass('bg-primary', 'text-primary-foreground', 'h-9', 'px-4', 'py-2')

    const remove = screen.getByRole('button', { name: 'Delete' })
    expect(remove).toHaveAttribute('data-variant', 'destructive')
    expect(remove).toHaveAttribute('data-size', 'sm')
    expect(remove).toHaveClass('bg-destructive', 'text-white', 'h-8', 'px-3')

    const settings = screen.getByRole('button', { name: 'Open settings' })
    expect(settings).toHaveAttribute('data-size', 'icon')
    expect(settings).toHaveClass('bg-background', 'shadow-xs', 'size-9')
  })

  it('does not call onClick while disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Save' })

    expect(button).toBeDisabled()
    await user.click(button)

    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders the child element through asChild and keeps the button styling', () => {
    render(
      <Button asChild variant="link">
        <a href="/members">Members</a>
      </Button>,
    )

    const link = screen.getByRole('link', { name: 'Members' })

    expect(link).toHaveAttribute('data-slot', 'button')
    expect(link).toHaveClass('text-primary', 'underline-offset-4')
  })
})
