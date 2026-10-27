import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AutoComplete, type AutoCompleteOption } from './auto-complete'

const options: AutoCompleteOption[] = [
  { value: 'engineering', label: 'Engineering', description: 'Platform and infrastructure' },
  { value: 'design', label: 'Design', description: 'Product design' },
  { value: 'support', label: 'Support', description: 'Customer support', disabled: true },
]

function Harness({ onSelect = vi.fn() }: { onSelect?: (option: AutoCompleteOption) => void }) {
  const [value, setValue] = useState('')
  return (
    <AutoComplete
      options={options}
      value={value}
      onValueChange={setValue}
      onSelect={onSelect}
      placeholder="Find a team"
      ariaLabel="Team"
      emptyLabel="No teams found"
    />
  )
}

describe('AutoComplete', () => {
  it('filters suggestions and selects an option', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)
    const input = screen.getByRole('combobox', { name: 'Team' })

    await user.type(input, 'des')
    expect(screen.getByRole('option', { name: /Design/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Engineering/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: /Design/ }))

    expect(input).toHaveValue('Design')
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'design' }))
  })

  it('supports keyboard selection and ignores disabled options', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)
    const input = screen.getByRole('combobox', { name: 'Team' })

    await user.type(input, 'en')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(input).toHaveValue('Engineering')
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'engineering' }))

    await user.clear(input)
    await user.type(input, 'sup')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(input).toHaveValue('sup')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('keeps free text when nothing matches', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)
    const input = screen.getByRole('combobox', { name: 'Team' })

    await user.type(input, 'custom squad')
    expect(screen.getByText('No teams found')).toBeInTheDocument()
    await user.keyboard('{Enter}')

    expect(input).toHaveValue('custom squad')
    expect(onSelect).not.toHaveBeenCalled()
  })
})
