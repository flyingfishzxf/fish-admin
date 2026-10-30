import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AnchorNav } from './anchor-nav'

const items = [
  { id: 'section-overview', label: 'Overview' },
  { id: 'section-security', label: 'Security' },
]

function Harness({ offset = -10 }: { offset?: number }) {
  const rootRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <AnchorNav items={items} ariaLabel="Sections" rootRef={rootRef} offset={offset} />
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

  it('activates a section that lands a sub-pixel past the offset line', () => {
    render(<Harness offset={8} />)

    const root = screen.getByTestId('root')
    const overview = document.getElementById('section-overview')!
    const security = document.getElementById('section-security')!

    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect)
    vi.spyOn(overview, 'getBoundingClientRect').mockReturnValue({ top: -20 } as DOMRect)
    // Landed 0.4px below the 108px boundary after the browser rounded scrollTop.
    vi.spyOn(security, 'getBoundingClientRect').mockReturnValue({ top: 108.4 } as DOMRect)

    act(() => {
      root.dispatchEvent(new Event('scroll'))
    })

    expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-current', 'location')
  })
})
