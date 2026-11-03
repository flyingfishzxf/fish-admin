import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { RadioGroup, RadioGroupItem } from './radio-group'

function ControlledRadioGroup({
  disabledValue,
  onValueChange,
}: {
  disabledValue?: string
  onValueChange?: (value: string) => void
}) {
  const [value, setValue] = useState('starter')

  return (
    <RadioGroup
      aria-label="Plan"
      value={value}
      onValueChange={(next) => {
        onValueChange?.(next)
        setValue(next)
      }}
    >
      <RadioGroupItem value="starter" aria-label="Starter" />
      <RadioGroupItem value="growth" aria-label="Growth" disabled={disabledValue === 'growth'} />
      <RadioGroupItem value="scale" aria-label="Scale" />
    </RadioGroup>
  )
}

describe('RadioGroup', () => {
  it('selects an option on click and reports the value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ControlledRadioGroup onValueChange={onValueChange} />)
    const starter = screen.getByRole('radio', { name: 'Starter' })
    const growth = screen.getByRole('radio', { name: 'Growth' })

    expect(starter).toHaveAttribute('aria-checked', 'true')

    await user.click(growth)

    expect(onValueChange).toHaveBeenCalledWith('growth')
    expect(growth).toHaveAttribute('aria-checked', 'true')
    expect(starter).toHaveAttribute('aria-checked', 'false')
  })

  it('moves the selection with the arrow keys', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ControlledRadioGroup onValueChange={onValueChange} />)
    const starter = screen.getByRole('radio', { name: 'Starter' })
    const growth = screen.getByRole('radio', { name: 'Growth' })

    await user.click(starter)

    // Radix moves focus from a timer after keydown; fireEvent keeps the arrow
    // "pressed" so the focus handler selects the next item.
    fireEvent.keyDown(starter, { key: 'ArrowRight' })

    await waitFor(() => expect(growth).toHaveAttribute('aria-checked', 'true'))
    expect(growth).toHaveFocus()
    expect(starter).toHaveAttribute('aria-checked', 'false')
    expect(onValueChange).toHaveBeenLastCalledWith('growth')

    fireEvent.keyDown(growth, { key: 'ArrowLeft' })

    await waitFor(() => expect(starter).toHaveAttribute('aria-checked', 'true'))
    expect(onValueChange).toHaveBeenLastCalledWith('starter')
  })

  it('skips disabled options while arrowing and refuses direct clicks', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ControlledRadioGroup disabledValue="growth" onValueChange={onValueChange} />)
    const starter = screen.getByRole('radio', { name: 'Starter' })
    const growth = screen.getByRole('radio', { name: 'Growth' })
    const scale = screen.getByRole('radio', { name: 'Scale' })

    expect(growth).toBeDisabled()

    await user.click(starter)
    fireEvent.keyDown(starter, { key: 'ArrowRight' })

    await waitFor(() => expect(scale).toHaveAttribute('aria-checked', 'true'))
    expect(growth).toHaveAttribute('aria-checked', 'false')
    expect(onValueChange).toHaveBeenLastCalledWith('scale')

    onValueChange.mockClear()
    await user.click(growth)

    expect(onValueChange).not.toHaveBeenCalled()
    expect(scale).toHaveAttribute('aria-checked', 'true')
  })
})
