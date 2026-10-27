import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TreeItem } from '../tree/tree'
import { TreeSelect } from './tree-select'

const items: TreeItem[] = [
  { id: 'engineering', parentId: null, label: 'Engineering' },
  { id: 'frontend', parentId: 'engineering', label: 'Frontend' },
  { id: 'design', parentId: null, label: 'Design' },
]

describe('TreeSelect', () => {
  beforeEach(async () => {})

  it('shows the full path for the current node and selects a new one', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <TreeSelect
        items={items}
        value="frontend"
        onChange={onChange}
        placeholder="Choose a department"
        ariaLabel="Department"
        clearLabel="Clear department"
      />,
    )

    const trigger = screen.getByRole('button', { name: /^Department/ })
    expect(trigger).toHaveTextContent('Engineering / Frontend')

    await user.click(trigger)
    await user.click(await screen.findByRole('treeitem', { name: 'Design' }))

    expect(onChange).toHaveBeenCalledWith('design')
  })

  it('clears the selected node', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(
      <TreeSelect
        items={items}
        value="frontend"
        onChange={vi.fn()}
        onClear={onClear}
        placeholder="Choose a department"
        ariaLabel="Department"
        clearLabel="Clear department"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear department' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
