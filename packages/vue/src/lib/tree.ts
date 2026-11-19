export interface TreeSourceNode {
  id: string
  parentId: string | null
}

export interface TreeNode<T extends TreeSourceNode> {
  data: T
  children: TreeNode<T>[]
}

export interface FlatTreeEntry<T extends TreeSourceNode> {
  node: T
  depth: number
  parentId: string | null
  hasChildren: boolean
}

export function buildTree<T extends TreeSourceNode>(items: T[]): TreeNode<T>[] {
  const nodes = new Map<string, TreeNode<T>>()
  for (const item of items) {
    nodes.set(item.id, { data: item, children: [] })
  }

  const roots: TreeNode<T>[] = []
  for (const item of items) {
    const node = nodes.get(item.id)!
    const parent = item.parentId ? nodes.get(item.parentId) : undefined
    if (parent && parent !== node) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Records trapped in a parent cycle never reach a root; detach one link and
  // surface the rest so no data disappears and traversal stays finite.
  const reachable = new Set<TreeNode<T>>()
  const visit = (node: TreeNode<T>) => {
    if (reachable.has(node)) return
    reachable.add(node)
    node.children.forEach(visit)
  }
  roots.forEach(visit)

  for (const node of nodes.values()) {
    if (reachable.has(node)) continue

    if (node.data.parentId) {
      const parent = nodes.get(node.data.parentId)
      if (parent) parent.children = parent.children.filter((child) => child !== node)
    }
    roots.push(node)
    visit(node)
  }

  return roots
}

export function flattenTree<T extends TreeSourceNode>(
  nodes: TreeNode<T>[],
  depth = 0,
): FlatTreeEntry<T>[] {
  return nodes.flatMap((node) => [
    {
      node: node.data,
      depth,
      parentId: node.data.parentId,
      hasChildren: node.children.length > 0,
    },
    ...flattenTree(node.children, depth + 1),
  ])
}

export function visibleTreeEntries<T extends TreeSourceNode>(
  nodes: TreeNode<T>[],
  expandedIds: ReadonlySet<string>,
): FlatTreeEntry<T>[] {
  const entries: FlatTreeEntry<T>[] = []

  const walk = (node: TreeNode<T>, depth: number) => {
    entries.push({
      node: node.data,
      depth,
      parentId: node.data.parentId,
      hasChildren: node.children.length > 0,
    })
    if (node.children.length > 0 && expandedIds.has(node.data.id)) {
      node.children.forEach((child) => walk(child, depth + 1))
    }
  }

  nodes.forEach((node) => walk(node, 0))
  return entries
}

export function treePath<T extends TreeSourceNode>(items: T[], id: string): T[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const path: T[] = []
  const seen = new Set<string>()
  let current = byId.get(id)

  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    path.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }

  return path
}

export function treeSubtreeIds<T extends TreeSourceNode>(items: T[], id: string): Set<string> {
  const ids = new Set<string>([id])
  let changed = true

  while (changed) {
    changed = false
    for (const item of items) {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id)
        changed = true
      }
    }
  }

  return ids
}

export function wouldCreateCycle<T extends TreeSourceNode>(
  items: T[],
  nodeId: string,
  parentId: string | null,
): boolean {
  if (!parentId) return false
  if (parentId === nodeId) return true
  return treePath(items, parentId).some((node) => node.id === nodeId)
}

export function treeAncestorIds<T extends TreeSourceNode>(items: T[], id: string): string[] {
  return treePath(items, id)
    .slice(0, -1)
    .map((node) => node.id)
}
