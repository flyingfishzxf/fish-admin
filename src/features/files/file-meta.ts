import { File, FileImage, FileSpreadsheet, FileText, type LucideIcon } from 'lucide-react'

import type { WorkspaceFile } from '@/types'

export type FileKindName = 'image' | 'document' | 'data'

export function formatFileSize(bytes: number, language: string) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${new Intl.NumberFormat(language.startsWith('zh') ? 'zh-CN' : 'en', {
    maximumFractionDigits: 1,
  }).format(value)} ${units[exponent]}`
}

export function fileKindOf(file: Pick<WorkspaceFile, 'mime'>): FileKindName {
  if (file.mime.startsWith('image/')) return 'image'
  if (file.mime === 'text/csv' || file.mime === 'application/json') return 'data'
  return 'document'
}

export function fileIcon(file: Pick<WorkspaceFile, 'mime'>): LucideIcon {
  const kind = fileKindOf(file)
  if (kind === 'image') return FileImage
  if (kind === 'data') return FileSpreadsheet
  if (file.mime === 'application/pdf' || file.mime === 'text/markdown') return FileText
  return File
}

export function fileExtension(name: string) {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return name.slice(0, 4).toUpperCase()
  return name.slice(dot + 1).toUpperCase()
}

export function isPreviewable(file: Pick<WorkspaceFile, 'mime' | 'dataUrl'>) {
  return file.mime.startsWith('image/') && Boolean(file.dataUrl)
}
