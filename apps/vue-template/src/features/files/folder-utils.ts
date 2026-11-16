import type { FileFolderSummary } from './api'

export interface FolderOption {
  value: string
  label: string
  description: string
}

/**
 * Flattens the folder tree into "Design / Brand" paths, sorted by name at every
 * level, so a move control can offer every folder in one list.
 */
export function flattenFolders(folders: FileFolderSummary[]): FolderOption[] {
  const options: FolderOption[] = []
  const walk = (parentId: string | null, trail: string[]) => {
    for (const folder of folders
      .filter((entry) => entry.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const path = [...trail, folder.name]
      options.push({
        value: folder.id,
        label: path.join(' / '),
        description: String(folder.fileCount),
      })
      walk(folder.id, path)
    }
  }
  walk(null, [])
  return options
}

/** Bottom-up id chain for a folder, used to seed the move control. */
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

/** The breadcrumb trail for a folder, root first. */
export function folderBreadcrumb(folders: FileFolderSummary[], folderId: string) {
  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  return folderPathIds(folders, folderId)
    .map((id) => byId.get(id))
    .filter((folder): folder is FileFolderSummary => Boolean(folder))
}

/** "A / B / C" for one folder id, or an empty string when it is unknown. */
export function folderPathLabel(folders: FileFolderSummary[], folderId: string) {
  return folderBreadcrumb(folders, folderId)
    .map((folder) => folder.name)
    .join(' / ')
}

export interface FolderRow {
  id: string
  name: string
  depth: number
  fileCount: number
}

/**
 * Depth-first rows with an indent level. Rendering a flat list keeps the tree a
 * plain list of buttons — no recursion, no roving tabindex, and the DOM order is
 * already the reading order for a screen reader.
 */
export function folderRows(folders: FileFolderSummary[]): FolderRow[] {
  const rows: FolderRow[] = []
  const walk = (parentId: string | null, depth: number) => {
    for (const folder of folders
      .filter((entry) => entry.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))) {
      rows.push({ id: folder.id, name: folder.name, depth, fileCount: folder.fileCount })
      walk(folder.id, depth + 1)
    }
  }
  walk(null, 0)
  return rows
}
