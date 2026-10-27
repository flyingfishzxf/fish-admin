import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'

import { TimePicker } from './time-picker'

function Harness({ initialValue }: { initialValue?: string }) {
  const [value, setValue] = useState<string | undefined>(initialValue)

  return (
    <TimePicker
      value={value}
      onChange={setValue}
      placeholder="Pick a time"
      ariaLabel="Start time"
    />
  )
}

async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
}

describe('TimePicker', () => {
  beforeAll(async () => {})

  it('renders the placeholder when empty', () => {
    render(<Harness />)

    expect(screen.getByRole('button', { name: /^Start time/ })).toHaveTextContent('Pick a time')
  })

  it('selects an hour and minute, then clears', async () => {
    const user = userEvent.setup()
    render(<Harness initialValue="08:30" />)

    const trigger = screen.getByRole('button', { name: /^Start time/ })
    expect(trigger).toHaveTextContent('08:30')

    await user.click(trigger)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await chooseOption(user, 'Start time hours', '09')
    expect(trigger).toHaveTextContent('09:30')

    await chooseOption(user, 'Start time minutes', '45')
    expect(trigger).toHaveTextContent('09:45')

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(trigger).toHaveTextContent('Pick a time')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
