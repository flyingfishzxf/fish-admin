import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BackTop } from './back-top'

function Harness() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <div data-testid="scroller" ref={scrollRef} />
      <BackTop targetRef={scrollRef} threshold={100} label="Back to top" />
    </div>
  )
}

describe('BackTop', () => {
  beforeEach(async () => {})

  it('appears after the panel scrolls past the threshold and returns to the top', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const scroller = screen.getByTestId('scroller')
    const scrollTo = vi.fn()
    scroller.scrollTo = scrollTo

    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument()

    Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: 240 })
    fireEvent.scroll(scroller)

    const button = screen.getByRole('button', { name: 'Back to top' })
    await user.click(button)

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('stays hidden below the threshold', () => {
    render(<Harness />)

    const scroller = screen.getByTestId('scroller')
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: 40 })
    fireEvent.scroll(scroller)

    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument()
  })
})
