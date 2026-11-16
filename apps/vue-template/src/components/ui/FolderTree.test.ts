import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FolderTree from './FolderTree.vue'

const folders = [
  { id: 'f1', name: 'Design', parentId: null, fileCount: 3 },
  { id: 'f2', name: 'Brand', parentId: 'f1', fileCount: 2 },
  { id: 'f3', name: 'Engineering', parentId: null, fileCount: 9 },
]

function mountTree(selectedId?: string) {
  return mount(FolderTree, {
    props: {
      folders,
      selectedId,
      allLabel: 'All files',
      total: 14,
      emptyLabel: 'No folders yet.',
      ariaLabel: 'Folder tree',
    },
  })
}

describe('FolderTree', () => {
  it('lists the all-files row plus every folder with its count', () => {
    const tree = mountTree()
    expect(tree.attributes('aria-label')).toBe('Folder tree')
    expect(tree.get('[data-folder-all]').text()).toContain('All files')
    expect(tree.get('[data-folder-all]').text()).toContain('14')

    const rows = tree.findAll('[data-folder-id]')
    expect(rows.map((row) => row.attributes('data-folder-id'))).toEqual(['f1', 'f2', 'f3'])
    expect(rows[1]?.text()).toContain('Brand')
    expect(rows[1]?.text()).toContain('2')
  })

  it('indents a child one level deeper than its parent', () => {
    const rows = mountTree().findAll('[data-folder-id]')
    expect(rows[0]?.attributes('style')).toContain('8px')
    expect(rows[1]?.attributes('style')).toContain('22px')
    expect(rows[2]?.attributes('style')).toContain('8px')
  })

  it('marks the current scope with aria-current', () => {
    expect(mountTree().get('[data-folder-all]').attributes('aria-current')).toBe('true')
    expect(mountTree('f2').get('[data-folder-id="f2"]').attributes('aria-current')).toBe('true')
    expect(mountTree('f2').get('[data-folder-all]').attributes('aria-current')).toBeUndefined()
  })

  it('emits the folder id, and undefined for all files', async () => {
    const tree = mountTree()
    await tree.get('[data-folder-id="f3"]').trigger('click')
    await tree.get('[data-folder-all]').trigger('click')
    expect(tree.emitted('select')).toEqual([['f3'], [undefined]])
  })

  it('says so when there are no folders', () => {
    const tree = mount(FolderTree, {
      props: {
        folders: [],
        allLabel: 'All files',
        total: 0,
        emptyLabel: 'No folders yet.',
        ariaLabel: 'Folder tree',
      },
    })
    expect(tree.text()).toContain('No folders yet.')
  })
})
