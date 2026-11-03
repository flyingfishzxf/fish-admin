import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { InputOTP, InputOTPGroup, InputOTPSlot } from './input-otp'

// input-otp probes document.elementFromPoint to detect password-manager overlays,
// which jsdom does not implement.
document.elementFromPoint = () => null

function Harness({
  maxLength = 6,
  onChange,
}: {
  maxLength?: number
  onChange?: (value: string) => void
}) {
  const [code, setCode] = useState('')

  return (
    <InputOTP
      aria-label="Verification code"
      maxLength={maxLength}
      value={code}
      onChange={(next) => {
        onChange?.(next)
        setCode(next)
      }}
    >
      <InputOTPGroup>
        {Array.from({ length: maxLength }, (_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}

function slotChars(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-slot="input-otp-slot"]')).map(
    (slot) => slot.textContent,
  )
}

describe('InputOTP', () => {
  it('fills the slots one digit at a time', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(<Harness onChange={onChange} />)
    const input = screen.getByLabelText('Verification code')

    await user.type(input, '123456')

    expect(onChange).toHaveBeenLastCalledWith('123456')
    expect(input).toHaveValue('123456')
    expect(slotChars(container)).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('fills every slot from a pasted code', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(<Harness onChange={onChange} />)
    const input = screen.getByLabelText('Verification code')

    await user.click(input)
    await user.paste('987654')

    expect(onChange).toHaveBeenLastCalledWith('987654')
    expect(input).toHaveValue('987654')
    expect(slotChars(container)).toEqual(['9', '8', '7', '6', '5', '4'])
  })

  it('truncates input to maxLength', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(<Harness maxLength={4} onChange={onChange} />)
    const input = screen.getByLabelText('Verification code')

    await user.type(input, '123456')

    expect(onChange).toHaveBeenLastCalledWith('1234')
    expect(input).toHaveValue('1234')
    expect(slotChars(container)).toEqual(['1', '2', '3', '4'])
  })
})
