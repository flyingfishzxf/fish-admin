export interface TransferLike {
  key: string
  label: string
  description?: string
  group?: string
  searchText?: string
  disabled?: boolean
}

export interface TransferGroup<T> {
  key: string
  items: T[]
}

export function splitTransferItems<T extends TransferLike>(
  items: T[],
  value: readonly string[],
): { source: T[]; target: T[] } {
  const selected = new Set(value)
  const source: T[] = []
  const target: T[] = []

  for (const item of items) {
    if (selected.has(item.key)) target.push(item)
    else source.push(item)
  }

  return { source, target }
}

export function filterTransferItems<T extends TransferLike>(items: T[], search: string): T[] {
  const query = search.trim().toLowerCase()
  if (!query) return items

  return items.filter((item) =>
    `${item.label} ${item.description ?? ''} ${item.searchText ?? ''}`
      .toLowerCase()
      .includes(query),
  )
}

export function groupTransferItems<T extends TransferLike>(items: T[]): TransferGroup<T>[] {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const key = item.group ?? ''
    const bucket = groups.get(key)
    if (bucket) bucket.push(item)
    else groups.set(key, [item])
  }

  return [...groups].map(([key, groupItems]) => ({ key, items: groupItems }))
}

export function toggleTransferValue(value: readonly string[], key: string): string[] {
  return value.includes(key) ? value.filter((item) => item !== key) : [...value, key]
}

export function toggleTransferKeys(value: readonly string[], keys: readonly string[]): string[] {
  if (keys.length === 0) return [...value]

  const selected = new Set(value)
  const allSelected = keys.every((key) => selected.has(key))

  if (allSelected) {
    const removing = new Set(keys)
    return value.filter((key) => !removing.has(key))
  }

  const next = [...value]
  for (const key of keys) {
    if (!selected.has(key)) next.push(key)
  }
  return next
}

export function transferKeysState(
  value: readonly string[],
  keys: readonly string[],
): 'none' | 'some' | 'all' {
  if (keys.length === 0) return 'none'
  const selected = new Set(value)
  const count = keys.filter((key) => selected.has(key)).length
  if (count === 0) return 'none'
  if (count === keys.length) return 'all'
  return 'some'
}
