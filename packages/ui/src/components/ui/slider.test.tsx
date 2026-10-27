import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { Slider } from './slider'

function ControlledSlider({ initial = 25 }: { initial?: number }) {
  const [value, setValue] = useState([initial])

  return (
    <Slider value={value} onValueChange={setValue} min={0} max={100} thumbLabels={['Volume']} />
  )
}

describe('Slider', () => {
  it('renders a single labelled thumb with data slots', () => {
    const { container } = render(<ControlledSlider />)
    const thumb = screen.getByRole('slider', { name: 'Volume' })

    expect(thumb).toHaveAttribute('aria-valuenow', '25')
    expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="slider-track"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="slider-range"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="slider-thumb"]')).toBe(thumb)
  })

  it('changes the value with the arrow keys', () => {
    render(<ControlledSlider />)
    const thumb = screen.getByRole('slider', { name: 'Volume' })

    fireEvent.keyDown(thumb, { key: 'ArrowRight' })
    expect(thumb).toHaveAttribute('aria-valuenow', '26')

    fireEvent.keyDown(thumb, { key: 'ArrowLeft' })
    expect(thumb).toHaveAttribute('aria-valuenow', '25')
  })

  it('supports range values with one label per thumb', () => {
    render(<Slider defaultValue={[20, 80]} thumbLabels={['Minimum', 'Maximum']} />)

    expect(screen.getAllByRole('slider')).toHaveLength(2)
    expect(screen.getByRole('slider', { name: 'Minimum' })).toHaveAttribute('aria-valuenow', '20')
    expect(screen.getByRole('slider', { name: 'Maximum' })).toHaveAttribute('aria-valuenow', '80')
  })

  it('does not change while disabled', () => {
    render(<Slider defaultValue={[25]} thumbLabels={['Volume']} disabled />)
    const thumb = screen.getByRole('slider', { name: 'Volume' })

    expect(thumb).toHaveAttribute('data-disabled')

    fireEvent.keyDown(thumb, { key: 'ArrowRight' })
    expect(thumb).toHaveAttribute('aria-valuenow', '25')
  })
})
