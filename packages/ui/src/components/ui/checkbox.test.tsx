import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Checkbox } from './checkbox'

function ControlledCheckbox({
  disabled,
  onCheckedChange,
}: {
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const [checked, setChecked] = useState(false)

  return (
    <Checkbox
      aria-label="Product updates"
      checked={checked}
      disabled={disabled}
      onCheckedChange={(next) => {
        onCheckedChange?.(next === true)
        setChecked(next === true)
      }}
    />
  )
}

describe('Checkbox', () => {
  it('toggles checked on click and exposes aria-checked', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<ControlledCheckbox onCheckedChange={onCheckedChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' })

    expect(checkbox).toHaveAttribute('aria-checked', 'false')

    await user.click(checkbox)

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(checkbox).toHaveAttribute('aria-checked', 'true')
    expect(checkbox).toHaveAttribute('data-state', 'checked')

    await user.click(checkbox)

    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    expect(checkbox).toHaveAttribute('aria-checked', 'false')
    expect(checkbox).toHaveAttribute('data-state', 'unchecked')
  })

  it('does not toggle or report a change while disabled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<ControlledCheckbox disabled onCheckedChange={onCheckedChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Product updates' })

    expect(checkbox).toBeDisabled()
    expect(checkbox).toHaveAttribute('data-disabled')

    await user.click(checkbox)

    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(checkbox).toHaveAttribute('aria-checked', 'false')
  })
})
