import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Segmented, type SegmentedOption } from './segmented'

const options: SegmentedOption[] = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board', disabled: true },
]

function Harness() {
  const [value, setValue] = useState('list')

  return <Segmented aria-label="View" options={options} value={value} onValueChange={setValue} />
}

describe('Segmented', () => {
  it('changes the value on click and reflects the selected state', () => {
    render(<Harness />)
    const list = screen.getByRole('radio', { name: 'List' })
    const grid = screen.getByRole('radio', { name: 'Grid' })

    expect(list).toHaveAttribute('data-state', 'on')
    expect(list).toHaveAttribute('aria-checked', 'true')
    expect(grid).toHaveAttribute('data-state', 'off')
    expect(grid).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(grid)

    expect(grid).toHaveAttribute('data-state', 'on')
    expect(grid).toHaveAttribute('aria-checked', 'true')
    expect(list).toHaveAttribute('data-state', 'off')
    expect(list).toHaveAttribute('aria-checked', 'false')
  })

  it('does not select a disabled option', () => {
    const onValueChange = vi.fn()
    render(
      <Segmented aria-label="View" options={options} value="list" onValueChange={onValueChange} />,
    )
    const board = screen.getByRole('radio', { name: 'Board' })

    expect(board).toBeDisabled()

    fireEvent.click(board)

    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('data-state', 'on')
  })

  it('disables every option when the group is disabled', () => {
    render(
      <Segmented
        aria-label="View"
        options={[options[0], options[1]]}
        value="list"
        onValueChange={vi.fn()}
        disabled
      />,
    )

    expect(screen.getByRole('radio', { name: 'List' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Grid' })).toBeDisabled()
  })
})
