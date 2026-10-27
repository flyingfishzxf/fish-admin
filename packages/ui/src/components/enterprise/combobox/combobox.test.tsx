import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Combobox, type ComboboxOption } from './combobox'

const options: ComboboxOption[] = [
  { value: 'engineering', label: 'Engineering', description: 'Platform and product' },
  { value: 'design', label: 'Design', description: 'Product design' },
]

function renderCombobox(props: Partial<ComponentProps<typeof Combobox>> = {}) {
  return render(
    <Combobox
      options={options}
      onChange={vi.fn()}
      placeholder="Assign a team"
      searchPlaceholder="Search teams"
      ariaLabel="Team"
      clearLabel="Clear team"
      {...props}
    />,
  )
}

describe('Combobox', () => {
  beforeEach(async () => {})

  it('filters options and reports the selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderCombobox({ onChange })

    await user.click(screen.getByRole('combobox', { name: 'Team' }))
    await user.type(screen.getByPlaceholderText('Search teams'), 'des')
    await user.click(await screen.findByRole('option', { name: /Design/ }))

    expect(onChange).toHaveBeenCalledWith('design')
  })

  it('clears the current value without opening the list', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    renderCombobox({ value: 'design', onClear })

    expect(screen.getByRole('combobox', { name: 'Team' })).toHaveTextContent('Design')

    await user.click(screen.getByRole('button', { name: 'Clear team' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
