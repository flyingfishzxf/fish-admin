import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Label } from './label'

describe('Label', () => {
  it('associates htmlFor with the control and names it', () => {
    render(
      <div>
        <Label htmlFor="email">Email address</Label>
        <input id="email" onChange={vi.fn()} />
      </div>,
    )

    const label = screen.getByText('Email address')
    const input = screen.getByLabelText('Email address')

    expect(label).toHaveAttribute('for', 'email')
    expect(input).toHaveAttribute('id', 'email')
  })

  it('focuses the associated control when clicked', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Label htmlFor="email">Email address</Label>
        <input id="email" onChange={vi.fn()} />
      </div>,
    )
    const input = screen.getByLabelText('Email address')

    expect(input).not.toHaveFocus()

    await user.click(screen.getByText('Email address'))

    expect(input).toHaveFocus()
  })
})
