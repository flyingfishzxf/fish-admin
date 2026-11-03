import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Toggle } from './toggle'

function ControlledToggle({
  disabled,
  onPressedChange,
}: {
  disabled?: boolean
  onPressedChange?: (pressed: boolean) => void
}) {
  const [pressed, setPressed] = useState(false)

  return (
    <Toggle
      aria-label="Bold"
      pressed={pressed}
      disabled={disabled}
      onPressedChange={(next) => {
        onPressedChange?.(next)
        setPressed(next)
      }}
    >
      Bold
    </Toggle>
  )
}

describe('Toggle', () => {
  it('toggles aria-pressed on click', async () => {
    const user = userEvent.setup()
    const onPressedChange = vi.fn()
    render(<ControlledToggle onPressedChange={onPressedChange} />)
    const toggle = screen.getByRole('button', { name: 'Bold' })

    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)

    expect(onPressedChange).toHaveBeenLastCalledWith(true)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveAttribute('data-state', 'on')

    await user.click(toggle)

    expect(onPressedChange).toHaveBeenLastCalledWith(false)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(toggle).toHaveAttribute('data-state', 'off')
  })

  it('does not toggle while disabled', async () => {
    const user = userEvent.setup()
    const onPressedChange = vi.fn()
    render(<ControlledToggle disabled onPressedChange={onPressedChange} />)
    const toggle = screen.getByRole('button', { name: 'Bold' })

    expect(toggle).toBeDisabled()

    await user.click(toggle)

    expect(onPressedChange).not.toHaveBeenCalled()
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })
})
