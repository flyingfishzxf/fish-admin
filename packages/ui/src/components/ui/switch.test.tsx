import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Switch } from './switch'

function ControlledSwitch({
  disabled,
  onCheckedChange,
}: {
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const [checked, setChecked] = useState(false)

  return (
    <Switch
      aria-label="Product updates"
      checked={checked}
      disabled={disabled}
      onCheckedChange={(next) => {
        onCheckedChange?.(next)
        setChecked(next)
      }}
    />
  )
}

describe('Switch', () => {
  it('toggles on click and exposes the checked state', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<ControlledSwitch onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole('switch', { name: 'Product updates' })

    expect(control).toHaveAttribute('aria-checked', 'false')

    await user.click(control)

    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    expect(control).toHaveAttribute('aria-checked', 'true')
    expect(control).toHaveAttribute('data-state', 'checked')

    await user.click(control)

    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    expect(control).toHaveAttribute('aria-checked', 'false')
  })

  it('toggles with the Space key', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<ControlledSwitch onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole('switch', { name: 'Product updates' })

    await user.click(control)
    expect(control).toHaveAttribute('aria-checked', 'true')

    await user.keyboard(' ')

    expect(control).toHaveAttribute('aria-checked', 'false')
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  it('does not toggle while disabled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<ControlledSwitch disabled onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole('switch', { name: 'Product updates' })

    expect(control).toBeDisabled()

    await user.click(control)
    await user.keyboard(' ')

    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(control).toHaveAttribute('aria-checked', 'false')
  })
})
