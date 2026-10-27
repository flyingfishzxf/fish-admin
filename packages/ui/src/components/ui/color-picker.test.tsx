import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ColorPicker, normalizeHex } from './color-picker'

describe('normalizeHex', () => {
  it('expands short hex values and rejects invalid input', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc')
    expect(normalizeHex('6366F1')).toBe('#6366f1')
    expect(normalizeHex('#12345')).toBeNull()
    expect(normalizeHex('blue')).toBeNull()
  })
})

describe('ColorPicker', () => {
  it('commits a preset colour', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <ColorPicker
        value="#6366f1"
        onValueChange={onValueChange}
        ariaLabel="Brand color"
        hexLabel="Brand color hex"
        presetsLabel="Brand color presets"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Brand color: #6366f1' }))
    await user.click(screen.getByRole('button', { name: '#ec4899' }))

    expect(onValueChange).toHaveBeenCalledWith('#ec4899')
  })

  it('commits a typed hex value and restores invalid drafts', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <ColorPicker
        value="#6366f1"
        onValueChange={onValueChange}
        ariaLabel="Brand color"
        hexLabel="Brand color hex"
        pickerLabel="Brand color swatch"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Brand color: #6366f1' }))
    const hexInput = screen.getByRole('textbox', { name: 'Brand color hex' })
    expect(screen.getByLabelText('Brand color swatch')).toHaveAttribute('type', 'color')

    await user.clear(hexInput)
    await user.type(hexInput, 'nope')
    await user.tab()
    expect(onValueChange).not.toHaveBeenCalled()
    expect(hexInput).toHaveValue('#6366f1')

    await user.clear(hexInput)
    await user.type(hexInput, '#10b981{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('#10b981')
  })

  it('does not open when disabled', async () => {
    const user = userEvent.setup()
    render(<ColorPicker value="#6366f1" ariaLabel="Brand color" disabled />)

    const trigger = screen.getByRole('button', { name: 'Brand color: #6366f1' })
    expect(trigger).toBeDisabled()
    await user.click(trigger)
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })
})
