import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Transfer, type TransferItem } from './transfer'

const ITEMS: TransferItem[] = [
  { key: 'ada', label: 'Ada Lovelace', description: 'Analytics' },
  { key: 'grace', label: 'Grace Hopper', description: 'Platform' },
  { key: 'linus', label: 'Linus Torvalds', description: 'Kernel' },
  { key: 'margaret', label: 'Margaret Hamilton', description: 'Flight software', disabled: true },
]

function Harness({
  initialValue,
  onChange,
}: {
  initialValue: string[]
  onChange: (value: string[]) => void
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <Transfer
      items={ITEMS}
      value={value}
      onChange={(next) => {
        onChange(next)
        setValue(next)
      }}
      sourceTitle="Team members"
      targetTitle="Reviewers"
      emptySourceLabel="Everyone is assigned"
      emptyTargetLabel="No reviewers yet"
    />
  )
}

function sourceList() {
  return screen.getByRole('listbox', { name: 'Team members' })
}

function targetList() {
  return screen.getByRole('listbox', { name: 'Reviewers' })
}

function panelOf(list: HTMLElement) {
  const panel = list.closest('section')
  if (!panel) throw new Error('Transfer listbox is not inside a panel')
  return panel
}

describe('Transfer', () => {
  it('moves clicked options between the source and target panels', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<Harness initialValue={['grace']} onChange={onChange} />)

    expect(within(sourceList()).getAllByRole('option')).toHaveLength(3)
    expect(within(targetList()).getByRole('option', { name: /Grace Hopper/ })).toBeVisible()

    await user.click(within(sourceList()).getByRole('option', { name: /Ada Lovelace/ }))

    expect(onChange).toHaveBeenLastCalledWith(['grace', 'ada'])
    expect(
      within(sourceList()).queryByRole('option', { name: /Ada Lovelace/ }),
    ).not.toBeInTheDocument()
    expect(within(targetList()).getByRole('option', { name: /Ada Lovelace/ })).toBeVisible()

    await user.click(within(targetList()).getByRole('option', { name: /Grace Hopper/ }))

    expect(onChange).toHaveBeenLastCalledWith(['ada'])
    expect(within(sourceList()).getByRole('option', { name: /Grace Hopper/ })).toBeVisible()
    expect(
      within(targetList()).queryByRole('option', { name: /Grace Hopper/ }),
    ).not.toBeInTheDocument()
  })

  it('filters both panels through their own search fields', async () => {
    const user = userEvent.setup()

    render(<Harness initialValue={['grace']} onChange={vi.fn()} />)

    const sourceSearch = screen.getByRole('textbox', { name: 'Team members — Search…' })
    const targetSearch = screen.getByRole('textbox', { name: 'Reviewers — Search…' })

    await user.type(sourceSearch, 'linus')

    expect(within(sourceList()).getAllByRole('option')).toHaveLength(1)
    expect(within(sourceList()).getByRole('option', { name: /Linus Torvalds/ })).toBeVisible()

    await user.type(targetSearch, 'hopp')

    expect(within(targetList()).getAllByRole('option')).toHaveLength(1)
    expect(within(targetList()).getByRole('option', { name: /Grace Hopper/ })).toBeVisible()

    await user.clear(sourceSearch)

    expect(within(sourceList()).getAllByRole('option')).toHaveLength(3)
  })

  it('keeps disabled options in place and toggles select-all', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<Harness initialValue={['grace']} onChange={onChange} />)

    const margaret = within(sourceList()).getByRole('option', { name: /Margaret Hamilton/ })

    expect(margaret).toBeDisabled()

    await user.click(margaret)

    expect(onChange).not.toHaveBeenCalled()

    await user.click(within(panelOf(sourceList())).getByRole('checkbox', { name: 'Select all' }))

    expect(onChange).toHaveBeenLastCalledWith(['grace', 'ada', 'linus'])
    expect(within(sourceList()).getByRole('option', { name: /Margaret Hamilton/ })).toBeDisabled()
    expect(
      within(panelOf(sourceList())).getByRole('checkbox', { name: 'Select all' }),
    ).toBeDisabled()
    expect(
      within(panelOf(targetList())).getByRole('checkbox', { name: 'Select all' }),
    ).toBeChecked()

    await user.click(within(panelOf(targetList())).getByRole('checkbox', { name: 'Select all' }))

    expect(onChange).toHaveBeenLastCalledWith([])
    expect(within(targetList()).queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('No reviewers yet')).toBeVisible()
  })
})
