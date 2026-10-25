import type { CascaderOption } from '@/components/enterprise/cascader/cascader'

import type { FileFolderSummary } from './api'

export function folderCascaderOptions(folders: FileFolderSummary[]): CascaderOption[] {
  const build = (parentId: string | null): CascaderOption[] =>
    folders
      .filter((folder) => folder.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((folder) => ({
        value: folder.id,
        label: folder.name,
        children: build(folder.id),
      }))

  return build(null)
}

export function flattenFolders(folders: FileFolderSummary[]) {
  const options: Array<{ value: string; label: string; description?: string }> = []
  const walk = (parentId: string | null, trail: string[]) => {
    for (const folder of folders
      .filter((entry) => entry.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const path = [...trail, folder.name]
      options.push({
        value: folder.id,
        label: path.join(' / '),
        description: `${folder.fileCount}`,
      })
      walk(folder.id, path)
    }
  }
  walk(null, [])
  return options
}

export function folderPathIds(folders: FileFolderSummary[], folderId: string): string[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  const path: string[] = []
  let current = byId.get(folderId)
  const seen = new Set<string>()
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    path.unshift(current.id)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return path
}
