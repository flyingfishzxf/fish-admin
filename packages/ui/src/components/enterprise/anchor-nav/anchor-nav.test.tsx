import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AnchorNav } from './anchor-nav'

const items = [
  { id: 'section-overview', label: 'Overview' },
  { id: 'section-security', label: 'Security' },
]

function Harness() {
  const rootRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <AnchorNav items={items} ariaLabel="Sections" rootRef={rootRef} offset={-1} />
      <div ref={rootRef} data-testid="root">
        <section id="section-overview">Overview body</section>
        <section id="section-security">Security body</section>
      </div>
    </div>
  )
}

describe('AnchorNav', () => {
  it('marks the first section active and scrolls the root when clicked', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const root = screen.getByTestId('root')
    const scrollTo = vi.fn()
    root.scrollTo = scrollTo

    const [overview, security] = screen.getAllByRole('button')
    expect(overview).toHaveAttribute('aria-current', 'location')
    expect(security).not.toHaveAttribute('aria-current')

    await user.click(security!)

    expect(scrollTo).toHaveBeenCalledWith({ top: expect.any(Number), behavior: 'smooth' })
  })
})
