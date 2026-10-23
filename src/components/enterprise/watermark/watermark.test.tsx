import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Watermark } from '@/components/enterprise/watermark/watermark'

describe('Watermark', () => {
  it('renders its children above an aria-hidden canvas overlay', () => {
    const { container } = render(
      <Watermark text="Confidential">
        <p>Account balance</p>
      </Watermark>,
    )

    expect(screen.getByText('Account balance')).toBeInTheDocument()
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
  })
})
