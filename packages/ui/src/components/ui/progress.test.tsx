import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Progress } from './progress'

describe('Progress', () => {
  it('exposes a determinate value and its maximum', () => {
    render(<Progress aria-label="Upload progress" value={64} />)

    const progress = screen.getByRole('progressbar', { name: 'Upload progress' })
    const indicator = progress.querySelector<HTMLElement>('[data-slot="progress-indicator"]')

    expect(progress).toHaveAttribute('aria-valuemin', '0')
    expect(progress).toHaveAttribute('aria-valuemax', '100')
    expect(progress).toHaveAttribute('aria-valuenow', '64')
    expect(progress).toHaveAttribute('aria-valuetext', '64%')
    expect(progress).toHaveAttribute('data-state', 'loading')
    expect(indicator).toHaveStyle({ transform: 'translateX(-36%)' })
  })

  it('reports completion when the value reaches the maximum', () => {
    render(<Progress aria-label="Upload progress" value={100} />)

    const progress = screen.getByRole('progressbar', { name: 'Upload progress' })

    expect(progress).toHaveAttribute('aria-valuenow', '100')
    expect(progress).toHaveAttribute('aria-valuetext', '100%')
    expect(progress).toHaveAttribute('data-state', 'complete')
  })

  it('is indeterminate when no value is supplied', () => {
    render(<Progress aria-label="Preparing upload" />)

    const progress = screen.getByRole('progressbar', { name: 'Preparing upload' })
    const indicator = progress.querySelector<HTMLElement>('[data-slot="progress-indicator"]')

    expect(progress).toHaveAttribute('data-state', 'indeterminate')
    expect(progress).toHaveAttribute('aria-valuemax', '100')
    expect(progress).not.toHaveAttribute('aria-valuenow')
    expect(progress).not.toHaveAttribute('aria-valuetext')
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' })
  })
})
