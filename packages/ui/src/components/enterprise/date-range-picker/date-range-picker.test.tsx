import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DateRangePicker, type DateRangeValue } from './date-range-picker'

function dayCell(value: string) {
  const cell = document.querySelector<HTMLElement>(`[data-day="${value}"]`)
  if (!cell) throw new Error(`Missing calendar day: ${value}`)
  return cell
}

function dayButton(value: string) {
  return within(dayCell(value)).getByRole('button')
}

function Harness({
  initialValue,
  onChange,
}: {
  initialValue: DateRangeValue
  onChange: (value: DateRangeValue) => void
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <DateRangePicker
      value={value}
      onChange={(next) => {
        onChange(next)
        setValue(next)
      }}
      placeholder="Filter by date"
      ariaLabel="Report date range"
    />
  )
}

describe('DateRangePicker', () => {
  beforeEach(() => {
    // Only Date is faked: the calendar opens on April 2026 while timers stay real.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 3, 1))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('selects the start and end days and shows the range on the trigger', () => {
    const onChange = vi.fn()
    render(<Harness initialValue={{}} onChange={onChange} />)
    const trigger = screen.getByRole('button', { name: /^Report date range/ })

    expect(trigger).toHaveTextContent('Filter by date')

    fireEvent.click(trigger)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()

    fireEvent.click(dayButton('2026-04-10'))

    // react-day-picker starts a range with from = to on the first click.
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-04-10', to: '2026-04-10' })
    expect(trigger).toHaveTextContent('Apr 10, 2026 – Apr 10, 2026')
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()

    fireEvent.click(dayButton('2026-04-14'))

    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-04-10', to: '2026-04-14' })
    expect(trigger).toHaveTextContent('Apr 10, 2026 – Apr 14, 2026')
  })

  it('clears the range and closes the calendar', () => {
    const onChange = vi.fn()
    render(<Harness initialValue={{ from: '2026-04-10', to: '2026-04-14' }} onChange={onChange} />)
    const trigger = screen.getByRole('button', { name: /^Report date range/ })

    expect(trigger).toHaveTextContent('Apr 10, 2026 – Apr 14, 2026')

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(onChange).toHaveBeenLastCalledWith({})
    expect(trigger).toHaveTextContent('Filter by date')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
