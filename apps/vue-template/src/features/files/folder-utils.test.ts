import { describe, expect, it } from 'vitest'

import type { FileFolderSummary } from './api'
import {
  flattenFolders,
  folderBreadcrumb,
  folderPathIds,
  folderPathLabel,
  folderRows,
} from './folder-utils'

function folder(
  id: string,
  name: string,
  parentId: string | null,
  fileCount = 0,
): FileFolderSummary {
  return { id, name, parentId, fileCount }
}

// Deliberately unsorted and not in tree order.
const folders = [
  folder('folder-engineering', 'Engineering', null, 9),
  folder('folder-design', 'Design', null, 3),
  folder('folder-design-brand', 'Brand', 'folder-design', 2),
  folder('folder-engineering-specs', 'Specs', 'folder-engineering', 4),
  folder('folder-design-brand-logo', 'Logo', 'folder-design-brand', 1),
]

describe('flattenFolders', () => {
  it('walks parents before children, alphabetically at each level', () => {
    expect(flattenFolders(folders).map((option) => option.label)).toEqual([
      'Design',
      'Design / Brand',
      'Design / Brand / Logo',
      'Engineering',
      'Engineering / Specs',
    ])
  })

  it('carries the file count as the description', () => {
    const brand = flattenFolders(folders).find((option) => option.value === 'folder-design-brand')
    expect(brand?.description).toBe('2')
  })
})

describe('folderPathIds', () => {
  it('returns the chain root first', () => {
    expect(folderPathIds(folders, 'folder-design-brand-logo')).toEqual([
      'folder-design',
      'folder-design-brand',
      'folder-design-brand-logo',
    ])
  })

  it('returns an empty chain for an unknown folder', () => {
    expect(folderPathIds(folders, 'nope')).toEqual([])
  })

  it('stops instead of looping on a broken parent link', () => {
    const broken = [folder('a', 'A', 'b'), folder('b', 'B', 'a')]
    expect(folderPathIds(broken, 'a')).toEqual(['b', 'a'])
  })
})

describe('folderBreadcrumb', () => {
  it('returns the folder objects root first', () => {
    expect(
      folderBreadcrumb(folders, 'folder-engineering-specs').map((entry) => entry.name),
    ).toEqual(['Engineering', 'Specs'])
  })

  it('joins the path for a label', () => {
    expect(folderPathLabel(folders, 'folder-design-brand-logo')).toBe('Design / Brand / Logo')
    expect(folderPathLabel(folders, 'missing')).toBe('')
  })
})

describe('folderRows', () => {
  it('flattens depth-first with an indent level', () => {
    expect(folderRows(folders)).toEqual([
      { id: 'folder-design', name: 'Design', depth: 0, fileCount: 3 },
      { id: 'folder-design-brand', name: 'Brand', depth: 1, fileCount: 2 },
      { id: 'folder-design-brand-logo', name: 'Logo', depth: 2, fileCount: 1 },
      { id: 'folder-engineering', name: 'Engineering', depth: 0, fileCount: 9 },
      { id: 'folder-engineering-specs', name: 'Specs', depth: 1, fileCount: 4 },
    ])
  })

  it('returns nothing for an empty list', () => {
    expect(folderRows([])).toEqual([])
  })
})
