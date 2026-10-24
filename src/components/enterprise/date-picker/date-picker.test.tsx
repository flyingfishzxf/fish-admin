import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'

import { DatePicker } from '@/components/enterprise/date-picker/date-picker'
import { ensureNamespaces } from '@/lib/i18n'

function Harness({
  initialValue,
  min,
  max,
}: {
  initialValue?: string
  min?: string
  max?: string
}) {
  const [value, setValue] = useState<string | undefined>(initialValue)

  return (
    <DatePicker
      value={value}
      onChange={setValue}
      placeholder="Pick a date"
      ariaLabel="Start date"
      min={min}
      max={max}
    />
  )
}

function openPicker() {
  fireEvent.click(screen.getByRole('button', { name: /^Start date/ }))
}

function dayCell(value: string) {
  const cell = document.querySelector<HTMLElement>(`[data-day="${value}"]`)
  if (!cell) throw new Error(`Missing calendar day: ${value}`)
  return cell
}

describe('DatePicker', () => {
  beforeAll(async () => {
    await ensureNamespaces('common')
  })

  it('renders the placeholder when empty', () => {
    render(<Harness />)

    expect(screen.getByRole('button', { name: /^Start date/ })).toHaveTextContent('Pick a date')
  })

  it('opens, selects a day, and closes', async () => {
    render(<Harness initialValue="2026-03-10" />)

    openPicker()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(within(dayCell('2026-03-15')).getByRole('button'))

    expect(screen.getByRole('button', { name: /^Start date/ })).toHaveTextContent('Mar 15, 2026')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('clears the selection from inside the popover', async () => {
    render(<Harness initialValue="2026-03-10" />)

    openPicker()
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(screen.getByRole('button', { name: /^Start date/ })).toHaveTextContent('Pick a date')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('disables days outside the min and max bounds', () => {
    render(<Harness initialValue="2026-03-15" min="2026-03-10" max="2026-03-20" />)

    openPicker()

    expect(within(dayCell('2026-03-05')).getByRole('button')).toBeDisabled()
    expect(within(dayCell('2026-03-25')).getByRole('button')).toBeDisabled()
    expect(within(dayCell('2026-03-15')).getByRole('button')).toBeEnabled()
  })
})
