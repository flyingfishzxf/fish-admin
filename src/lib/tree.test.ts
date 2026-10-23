import { describe, expect, it } from 'vitest'

import {
  buildTree,
  flattenTree,
  treeAncestorIds,
  treePath,
  treeSubtreeIds,
  visibleTreeEntries,
  wouldCreateCycle,
} from '@/lib/tree'

const nodes = [
  { id: 'engineering', parentId: null },
  { id: 'platform', parentId: 'engineering' },
  { id: 'frontend', parentId: 'engineering' },
  { id: 'design', parentId: null },
]

describe('tree helpers', () => {
  it('builds a tree in source order', () => {
    const tree = buildTree(nodes)

    expect(tree.map((node) => node.data.id)).toEqual(['engineering', 'design'])
    expect(tree[0]?.children.map((node) => node.data.id)).toEqual(['platform', 'frontend'])
  })

  it('treats missing parents as roots and breaks parent cycles', () => {
    const tree = buildTree([
      { id: 'orphan', parentId: 'missing' },
      { id: 'a', parentId: 'b' },
      { id: 'b', parentId: 'a' },
    ])

    expect(tree.map((node) => node.data.id)).toEqual(['orphan', 'a'])
    expect(tree[1]?.children.map((node) => node.data.id)).toEqual(['b'])
    expect(flattenTree(tree).map((entry) => entry.node.id)).toEqual(['orphan', 'a', 'b'])
  })

  it('flattens with depth and child information', () => {
    const flat = flattenTree(buildTree(nodes))

    expect(flat).toEqual([
      { node: nodes[0], depth: 0, parentId: null, hasChildren: true },
      { node: nodes[1], depth: 1, parentId: 'engineering', hasChildren: false },
      { node: nodes[2], depth: 1, parentId: 'engineering', hasChildren: false },
      { node: nodes[3], depth: 0, parentId: null, hasChildren: false },
    ])
  })

  it('hides the children of collapsed nodes', () => {
    const tree = buildTree(nodes)
    const collapsed = visibleTreeEntries(tree, new Set())

    expect(collapsed.map((entry) => entry.node.id)).toEqual(['engineering', 'design'])

    const expanded = visibleTreeEntries(tree, new Set(['engineering']))
    expect(expanded.map((entry) => entry.node.id)).toEqual([
      'engineering',
      'platform',
      'frontend',
      'design',
    ])
  })

  it('resolves paths from the root and stops on cycles', () => {
    expect(treePath(nodes, 'platform').map((node) => node.id)).toEqual(['engineering', 'platform'])
    expect(treeAncestorIds(nodes, 'platform')).toEqual(['engineering'])

    const cyclic = [
      { id: 'a', parentId: 'b' },
      { id: 'b', parentId: 'a' },
    ]
    expect(treePath(cyclic, 'a').map((node) => node.id)).toEqual(['b', 'a'])
  })

  it('collects the subtree including the node itself', () => {
    expect([...treeSubtreeIds(nodes, 'engineering')].sort()).toEqual([
      'engineering',
      'frontend',
      'platform',
    ])
    expect([...treeSubtreeIds(nodes, 'design')]).toEqual(['design'])
  })

  it('detects moves that would create a cycle', () => {
    expect(wouldCreateCycle(nodes, 'engineering', 'platform')).toBe(true)
    expect(wouldCreateCycle(nodes, 'engineering', 'engineering')).toBe(true)
    expect(wouldCreateCycle(nodes, 'design', 'engineering')).toBe(false)
    expect(wouldCreateCycle(nodes, 'engineering', null)).toBe(false)
  })
})
