import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

function ControlledSelect({
  disabled,
  onValueChange,
}: {
  disabled?: boolean
  onValueChange?: (value: string) => void
}) {
  const [value, setValue] = useState('viewer')

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        onValueChange?.(next)
        setValue(next)
      }}
    >
      <SelectTrigger aria-label="Role">
        <SelectValue placeholder="Choose a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="viewer">Viewer</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="member">Member</SelectItem>
      </SelectContent>
    </Select>
  )
}

describe('Select', () => {
  it('opens the list, reports the selection and updates the trigger', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ControlledSelect onValueChange={onValueChange} />)
    const trigger = screen.getByRole('combobox', { name: 'Role' })

    expect(trigger).toHaveTextContent('Viewer')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('option', { name: 'Viewer' })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('option', { name: 'Admin' }))

    expect(onValueChange).toHaveBeenCalledWith('admin')
    expect(trigger).toHaveTextContent('Admin')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('option', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('closes the list with Escape', async () => {
    const user = userEvent.setup()
    render(<ControlledSelect />)
    const trigger = screen.getByRole('combobox', { name: 'Role' })

    await user.click(trigger)
    expect(screen.getByRole('option', { name: 'Member' })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('option', { name: 'Member' })).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not open while disabled', async () => {
    const user = userEvent.setup()
    render(<ControlledSelect disabled />)
    const trigger = screen.getByRole('combobox', { name: 'Role' })

    expect(trigger).toBeDisabled()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })
})
