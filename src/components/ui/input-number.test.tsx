import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InputNumber } from '@/components/ui/input-number'
import { changeLanguage, i18nReady } from '@/lib/i18n'

type HarnessProps = {
  initialValue?: number | null
  min?: number
  max?: number
  step?: number
  precision?: number
  disabled?: boolean
}

function Harness({ initialValue = 3, ...props }: HarnessProps) {
  const [value, setValue] = useState<number | null>(initialValue)

  return <InputNumber aria-label="Quantity" value={value} onValueChange={setValue} {...props} />
}

describe('InputNumber', () => {
  beforeEach(async () => {
    await i18nReady
    await changeLanguage('en')
  })

  it('renders a spinbutton and steps with the buttons', () => {
    render(<Harness min={0} max={5} />)
    const input = screen.getByRole('spinbutton', { name: 'Quantity' })

    expect(input).toHaveValue('3')
    expect(input).toHaveAttribute('aria-valuenow', '3')
    expect(input).toHaveAttribute('aria-valuemin', '0')
    expect(input).toHaveAttribute('aria-valuemax', '5')
    expect(input).toHaveAttribute('aria-valuetext', '3')

    fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(input).toHaveValue('4')
    expect(input).toHaveAttribute('aria-valuenow', '4')

    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }))
    expect(input).toHaveValue('3')
  })

  it('steps with the arrow keys and formats using precision', () => {
    render(<Harness initialValue={1} min={0} max={2} step={0.5} precision={1} />)
    const input = screen.getByRole('spinbutton', { name: 'Quantity' })

    expect(input).toHaveValue('1.0')

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveValue('1.5')
    expect(input).toHaveAttribute('aria-valuenow', '1.5')
    expect(input).toHaveAttribute('aria-valuetext', '1.5')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveValue('0.5')
  })

  it('allows intermediate typing and commits parseable values', () => {
    const onValueChange = vi.fn()
    render(<InputNumber aria-label="Quantity" value={5} onValueChange={onValueChange} />)
    const input = screen.getByRole('spinbutton', { name: 'Quantity' })

    fireEvent.change(input, { target: { value: '-' } })
    expect(input).toHaveValue('-')
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '1.' } })
    expect(input).toHaveValue('1.')
    expect(onValueChange).toHaveBeenLastCalledWith(1)

    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue('')
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it('clamps and formats on blur', () => {
    render(<Harness initialValue={3} min={0} max={10} precision={0} />)
    const input = screen.getByRole('spinbutton', { name: 'Quantity' })

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '99' } })
    fireEvent.blur(input)

    expect(input).toHaveValue('10')
    expect(input).toHaveAttribute('aria-valuenow', '10')

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'abc' } })
    fireEvent.blur(input)

    expect(input).toHaveValue('10')
  })

  it('disables the buttons at the bounds', () => {
    render(<Harness initialValue={0} min={0} max={2} />)

    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Increase' })).toBeEnabled()
  })

  it('disables the input and both buttons', () => {
    render(<Harness disabled />)

    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
  })
})
