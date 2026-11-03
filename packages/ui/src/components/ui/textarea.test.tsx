import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Textarea } from './textarea'

function ControlledTextarea({
  disabled,
  onChange,
}: {
  disabled?: boolean
  onChange?: (value: string) => void
}) {
  const [value, setValue] = useState('')

  return (
    <Textarea
      aria-label="Release notes"
      value={value}
      disabled={disabled}
      onChange={(event) => {
        onChange?.(event.target.value)
        setValue(event.target.value)
      }}
    />
  )
}

describe('Textarea', () => {
  it('reports typed text through onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ControlledTextarea onChange={onChange} />)
    const textarea = screen.getByRole('textbox', { name: 'Release notes' })

    await user.type(textarea, 'Shipped{Enter}the beta')

    expect(textarea).toHaveValue('Shipped\nthe beta')
    expect(onChange).toHaveBeenCalled()
    expect(onChange).toHaveBeenLastCalledWith('Shipped\nthe beta')
  })

  it('does not accept typing while disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ControlledTextarea disabled onChange={onChange} />)
    const textarea = screen.getByRole('textbox', { name: 'Release notes' })

    expect(textarea).toBeDisabled()

    await user.type(textarea, 'Draft')

    expect(textarea).toHaveValue('')
    expect(onChange).not.toHaveBeenCalled()
  })
})
