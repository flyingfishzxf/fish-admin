import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Input } from './input'

function ControlledInput({
  disabled,
  onChange,
}: {
  disabled?: boolean
  onChange?: (value: string) => void
}) {
  const [value, setValue] = useState('')

  return (
    <Input
      aria-label="Workspace name"
      value={value}
      disabled={disabled}
      onChange={(event) => {
        onChange?.(event.target.value)
        setValue(event.target.value)
      }}
    />
  )
}

describe('Input', () => {
  it('reports every keystroke through onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ControlledInput onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Workspace name' })

    await user.type(input, 'Acme')

    expect(input).toHaveValue('Acme')
    expect(onChange).toHaveBeenCalledTimes(4)
    expect(onChange).toHaveBeenLastCalledWith('Acme')
  })

  it('does not accept typing while disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ControlledInput disabled onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Workspace name' })

    expect(input).toBeDisabled()

    await user.type(input, 'Acme')

    expect(input).toHaveValue('')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('passes aria-invalid through to the native input', () => {
    render(
      <div>
        <Input aria-label="Email" aria-invalid />
        <Input aria-label="Nickname" aria-invalid={false} />
      </div>,
    )

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('textbox', { name: 'Nickname' })).toHaveAttribute(
      'aria-invalid',
      'false',
    )
  })
})
