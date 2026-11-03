import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Tree, type TreeItem } from './tree'

const ITEMS: TreeItem[] = [
  { id: 'acme', parentId: null, label: 'Acme Corporation' },
  { id: 'engineering', parentId: 'acme', label: 'Engineering' },
  { id: 'platform', parentId: 'engineering', label: 'Platform' },
  { id: 'design', parentId: 'acme', label: 'Design' },
  { id: 'retired', parentId: 'acme', label: 'Legacy CRM', disabled: true },
]

function treeItem(name: string) {
  return screen.getByRole('treeitem', { name })
}

describe('Tree', () => {
  it('expands and collapses a branch through its chevron', async () => {
    const user = userEvent.setup()
    render(<Tree items={ITEMS} ariaLabel="Organization structure" />)

    const tree = screen.getByRole('tree', { name: 'Organization structure' })
    const acme = within(tree).getByRole('treeitem', { name: 'Acme Corporation' })

    expect(within(tree).getAllByRole('treeitem')).toHaveLength(4)
    expect(acme).toHaveAttribute('aria-expanded', 'true')
    expect(treeItem('Engineering')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('treeitem', { name: 'Platform' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Collapse Acme Corporation' }))

    expect(acme).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('treeitem', { name: 'Design' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expand Acme Corporation' }))

    expect(acme).toHaveAttribute('aria-expanded', 'true')
    expect(treeItem('Design')).toBeVisible()
  })

  it('reports the clicked node and ignores disabled nodes', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<Tree items={ITEMS} onSelect={onSelect} ariaLabel="Organization structure" />)

    await user.click(treeItem('Design'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenLastCalledWith('design')

    const retired = treeItem('Legacy CRM')
    expect(retired).toHaveAttribute('aria-disabled', 'true')

    await user.click(retired)

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('expands with ArrowRight, collapses with ArrowLeft and walks up to the parent', async () => {
    const user = userEvent.setup()

    render(
      <Tree
        items={ITEMS}
        selectedId="engineering"
        onSelect={vi.fn()}
        ariaLabel="Organization structure"
      />,
    )

    const engineering = treeItem('Engineering')

    engineering.focus()
    expect(engineering).toHaveFocus()

    await user.keyboard('{ArrowRight}')

    await waitFor(() => expect(treeItem('Platform')).toBeVisible())
    expect(engineering).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{ArrowLeft}')

    await waitFor(() =>
      expect(screen.queryByRole('treeitem', { name: 'Platform' })).not.toBeInTheDocument(),
    )
    expect(engineering).toHaveAttribute('aria-expanded', 'false')

    await user.keyboard('{ArrowLeft}')

    await waitFor(() => expect(treeItem('Acme Corporation')).toHaveFocus())
  })
})
