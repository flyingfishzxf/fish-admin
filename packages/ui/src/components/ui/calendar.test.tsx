import { render, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Calendar } from './calendar'

const APRIL_2026 = new Date(2026, 3, 1)

function dayCell(value: string) {
  const cell = document.querySelector<HTMLElement>(`[data-day="${value}"]`)
  if (!cell) throw new Error(`Missing calendar day: ${value}`)
  return cell
}

function dayButton(value: string) {
  return within(dayCell(value)).getByRole('button')
}

describe('Calendar', () => {
  it('selects a day and reports it through onSelect', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const selected = new Date(2026, 3, 15)

    render(
      <Calendar mode="single" defaultMonth={APRIL_2026} selected={selected} onSelect={onSelect} />,
    )

    expect(dayCell('2026-04-15')).toHaveAttribute('aria-selected', 'true')

    await user.click(dayButton('2026-04-20'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0]![0]).toEqual(new Date(2026, 3, 20))
  })

  it('moves focus to the next day with ArrowRight', async () => {
    const user = userEvent.setup()

    render(
      <Calendar
        mode="single"
        defaultMonth={APRIL_2026}
        selected={new Date(2026, 3, 15)}
        onSelect={vi.fn()}
      />,
    )

    dayButton('2026-04-15').focus()
    await user.keyboard('{ArrowRight}')

    await waitFor(() => expect(dayButton('2026-04-16')).toHaveFocus())
    expect(dayCell('2026-04-16')).toHaveAttribute('data-focused', 'true')
    expect(dayCell('2026-04-15')).not.toHaveAttribute('data-focused', 'true')
  })

  it('does not select a disabled date', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <Calendar
        mode="single"
        defaultMonth={APRIL_2026}
        disabled={new Date(2026, 3, 18)}
        onSelect={onSelect}
      />,
    )

    const disabledDay = dayCell('2026-04-18')

    expect(disabledDay).toHaveAttribute('data-disabled', 'true')
    expect(dayButton('2026-04-18')).toBeDisabled()

    await user.click(dayButton('2026-04-18'))

    expect(onSelect).not.toHaveBeenCalled()
  })
})
