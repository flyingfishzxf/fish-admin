import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Rate } from './rate'

describe('Rate', () => {
  beforeEach(async () => {})

  it('selects a star and clears when the same star is picked again', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<Rate value={0} onChange={onChange} ariaLabel="Rating" />)

    const stars = screen.getAllByRole('radio')
    expect(stars).toHaveLength(5)

    await user.click(stars[3]!)
    expect(onChange).toHaveBeenLastCalledWith(4)

    rerender(<Rate value={4} onChange={onChange} ariaLabel="Rating" />)
    await user.click(screen.getAllByRole('radio')[3]!)
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  it('moves focus between stars with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<Rate value={2} onChange={() => {}} ariaLabel="Rating" />)

    const stars = screen.getAllByRole('radio')
    stars[1]!.focus()
    await user.keyboard('{ArrowRight}')
    expect(stars[2]).toHaveFocus()

    await user.keyboard('{Home}')
    expect(stars[0]).toHaveFocus()

    await user.keyboard('{End}')
    expect(stars[4]).toHaveFocus()
  })

  it('disables every star when read-only', () => {
    render(<Rate value={4} readOnly ariaLabel="Rating" />)

    for (const star of screen.getAllByRole('radio')) {
      expect(star).toBeDisabled()
    }
  })
})
