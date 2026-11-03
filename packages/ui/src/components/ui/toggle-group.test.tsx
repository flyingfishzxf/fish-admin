import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ToggleGroup, ToggleGroupItem } from './toggle-group'

function SingleToggleGroup({ onValueChange }: { onValueChange?: (value: string) => void }) {
  const [value, setValue] = useState('rows')

  return (
    <ToggleGroup
      type="single"
      aria-label="Result layout"
      value={value}
      onValueChange={(next) => {
        if (!next) return
        onValueChange?.(next)
        setValue(next)
      }}
    >
      <ToggleGroupItem value="rows">Rows</ToggleGroupItem>
      <ToggleGroupItem value="columns">Columns</ToggleGroupItem>
    </ToggleGroup>
  )
}

function MultipleToggleGroup({ onValueChange }: { onValueChange?: (value: string[]) => void }) {
  const [value, setValue] = useState<string[]>(['bold'])

  return (
    <ToggleGroup
      type="multiple"
      aria-label="Text formatting"
      value={value}
      onValueChange={(next) => {
        onValueChange?.(next)
        setValue(next)
      }}
    >
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
    </ToggleGroup>
  )
}

describe('ToggleGroup', () => {
  it('keeps a single selection in single mode', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SingleToggleGroup onValueChange={onValueChange} />)
    const rows = screen.getByRole('radio', { name: 'Rows' })
    const columns = screen.getByRole('radio', { name: 'Columns' })

    expect(rows).toHaveAttribute('aria-checked', 'true')
    expect(columns).toHaveAttribute('aria-checked', 'false')

    await user.click(columns)

    expect(onValueChange).toHaveBeenLastCalledWith('columns')
    expect(columns).toHaveAttribute('aria-checked', 'true')
    expect(rows).toHaveAttribute('aria-checked', 'false')
  })

  it('adds and removes values independently in multiple mode', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<MultipleToggleGroup onValueChange={onValueChange} />)
    const bold = screen.getByRole('button', { name: 'Bold' })
    const italic = screen.getByRole('button', { name: 'Italic' })

    expect(bold).toHaveAttribute('aria-pressed', 'true')
    expect(italic).toHaveAttribute('aria-pressed', 'false')

    await user.click(italic)

    expect(onValueChange).toHaveBeenLastCalledWith(['bold', 'italic'])
    expect(bold).toHaveAttribute('aria-pressed', 'true')
    expect(italic).toHaveAttribute('aria-pressed', 'true')

    await user.click(bold)

    expect(onValueChange).toHaveBeenLastCalledWith(['italic'])
    expect(bold).toHaveAttribute('aria-pressed', 'false')
    expect(italic).toHaveAttribute('aria-pressed', 'true')
  })
})
