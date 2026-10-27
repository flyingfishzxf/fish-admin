import { Copy, Eye, Lock, Star, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Popconfirm,
  Badge,
  Button,
  Checkbox,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@fish-admin/react'

import { formatDate } from '@/lib/format'

import type { WorkspaceFile } from '@/types'

import type { FilesView } from '../search'
import { fileExtension, fileIcon, formatFileSize, isPreviewable } from '../file-meta'

interface FileListProps {
  files: WorkspaceFile[]
  view: FilesView
  selectedId: string | null
  selectedIds: ReadonlySet<string>
  canManage: boolean
  language: string
  onOpen: (file: WorkspaceFile) => void
  onToggleSelected: (id: string, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
  onToggleFavorite: (file: WorkspaceFile) => void
  onCopyName: (file: WorkspaceFile) => void
  onDelete: (file: WorkspaceFile) => void
  deletingId?: string
}

function FileContextMenu({
  file,
  canManage,
  onOpen,
  onToggleFavorite,
  onCopyName,
  children,
}: {
  file: WorkspaceFile
  canManage: boolean
  onOpen: (file: WorkspaceFile) => void
  onToggleFavorite: (file: WorkspaceFile) => void
  onCopyName: (file: WorkspaceFile) => void
  children: ReactNode
}) {
  const { t } = useTranslation('files')

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onOpen(file)}>
          <Eye aria-hidden />
          {t('actions.preview')}
        </ContextMenuItem>
        {canManage ? (
          <ContextMenuItem onSelect={() => onToggleFavorite(file)}>
            <Star aria-hidden />
            {file.favorite ? t('actions.unfavorite') : t('actions.favorite')}
          </ContextMenuItem>
        ) : null}
        <ContextMenuItem onSelect={() => onCopyName(file)}>
          <Copy aria-hidden />
          {t('actions.copyName')}
        </ContextMenuItem>
        {canManage ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem disabled className="text-muted-foreground">
              <Trash2 aria-hidden />
              {t('actions.deleteHint')}
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  )
}

function FileBadges({ file }: { file: WorkspaceFile }) {
  const { t } = useTranslation('files')

  // One line, never wrapped: every card must keep the same text-block height so
  // the delete footer cannot float above a gap in a stretched grid row.
  return (
    <div className="flex items-center gap-1">
      <Badge variant="outline">{fileExtension(file.name)}</Badge>
      {file.visibility === 'private' ? (
        <Badge variant="secondary">
          <Lock aria-hidden />
          <span className="sr-only">{t('item.private')}</span>
        </Badge>
      ) : null}
      {file.favorite ? (
        <Badge variant="secondary" className="text-warning">
          <Star aria-hidden className="fill-warning" />
          <span className="sr-only">{t('item.favorite')}</span>
        </Badge>
      ) : null}
    </div>
  )
}

export function FileList({
  files,
  view,
  selectedId,
  selectedIds,
  canManage,
  language,
  onOpen,
  onToggleSelected,
  onToggleAll,
  onToggleFavorite,
  onCopyName,
  onDelete,
  deletingId,
}: FileListProps) {
  const { t } = useTranslation('files')
  const allSelected = files.length > 0 && files.every((file) => selectedIds.has(file.id))
  const someSelected = files.some((file) => selectedIds.has(file.id))

  if (view === 'list') {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                aria-label={t('list.selectAll')}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
              />
            </TableHead>
            <TableHead>{t('list.name')}</TableHead>
            <TableHead className="hidden @sm:table-cell">{t('list.type')}</TableHead>
            <TableHead className="hidden @lg:table-cell">{t('list.size')}</TableHead>
            <TableHead className="hidden @xl:table-cell">{t('list.visibility')}</TableHead>
            <TableHead className="hidden @3xl:table-cell">{t('list.updated')}</TableHead>
            <TableHead className="text-right">{t('list.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => {
            const Icon = fileIcon(file)
            const selected = selectedId === file.id
            return (
              <TableRow key={file.id} data-state={selected ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(file.id)}
                    aria-label={t('list.selectFile', { name: file.name })}
                    onCheckedChange={(checked) => onToggleSelected(file.id, checked === true)}
                  />
                </TableCell>
                <TableCell>
                  <FileContextMenu
                    file={file}
                    canManage={canManage}
                    onOpen={onOpen}
                    onToggleFavorite={onToggleFavorite}
                    onCopyName={onCopyName}
                  >
                    <button
                      type="button"
                      onClick={() => onOpen(file)}
                      className={cn(
                        'flex w-full max-w-64 min-w-0 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                        selected && 'font-medium text-accent-foreground',
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {isPreviewable(file) ? (
                          <img src={file.dataUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <Icon aria-hidden className="size-4 text-muted-foreground" />
                        )}
                      </span>
                      <span title={file.name} className="min-w-0 flex-1 truncate">
                        {file.name}
                      </span>
                    </button>
                  </FileContextMenu>
                </TableCell>
                <TableCell className="hidden @sm:table-cell">
                  <Badge variant="outline">{fileExtension(file.name)}</Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground @lg:table-cell">
                  {formatFileSize(file.size, language)}
                </TableCell>
                <TableCell className="hidden @xl:table-cell">
                  <Badge variant="secondary">
                    {file.visibility === 'private' ? <Lock aria-hidden /> : null}
                    {file.visibility === 'private' ? t('item.private') : t('item.team')}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground @3xl:table-cell">
                  {formatDate(file.updatedAt, language, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {canManage ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-pressed={file.favorite}
                        aria-label={
                          file.favorite
                            ? t('actions.unfavoriteNamed', { name: file.name })
                            : t('actions.favoriteNamed', { name: file.name })
                        }
                        onClick={() => onToggleFavorite(file)}
                      >
                        <Star
                          aria-hidden
                          className={cn('size-4', file.favorite && 'fill-warning text-warning')}
                        />
                      </Button>
                    ) : null}
                    {canManage ? (
                      <Popconfirm
                        title={t('list.deleteTitle')}
                        description={t('list.deleteDescription', { name: file.name })}
                        confirmLabel={t('actions.delete')}
                        destructive
                        pending={deletingId === file.id}
                        onConfirm={() => onDelete(file)}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('list.delete', { name: file.name })}
                        >
                          <Trash2 aria-hidden className="size-4" />
                        </Button>
                      </Popconfirm>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  // Track count follows the grid's own width, not the viewport: in the split
  // layout this pane is a resizable fraction of the page.
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,160px),1fr))] gap-3">
      {files.map((file) => {
        const Icon = fileIcon(file)
        const selected = selectedId === file.id
        return (
          <FileContextMenu
            key={file.id}
            file={file}
            canManage={canManage}
            onOpen={onOpen}
            onToggleFavorite={onToggleFavorite}
            onCopyName={onCopyName}
          >
            <div
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors',
                selected && 'border-primary ring-1 ring-primary/30',
              )}
            >
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedIds.has(file.id)}
                  aria-label={t('list.selectFile', { name: file.name })}
                  onCheckedChange={(checked) => onToggleSelected(file.id, checked === true)}
                  className="bg-background/90"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-pressed={file.favorite}
                aria-label={
                  file.favorite
                    ? t('actions.unfavoriteNamed', { name: file.name })
                    : t('actions.favoriteNamed', { name: file.name })
                }
                onClick={() => onToggleFavorite(file)}
                className={cn(
                  'absolute top-1.5 right-1.5 z-10 bg-background/80 backdrop-blur',
                  !canManage && 'hidden',
                )}
              >
                <Star
                  aria-hidden
                  className={cn('size-4', file.favorite && 'fill-warning text-warning')}
                />
              </Button>
              <button
                type="button"
                onClick={() => onOpen(file)}
                className="flex flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span className="sr-only">{t('list.openFile', { name: file.name })}</span>
                <span className="flex aspect-4/3 items-center justify-center overflow-hidden bg-muted/40">
                  {isPreviewable(file) ? (
                    <img src={file.dataUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <Icon aria-hidden className="size-10 text-muted-foreground" />
                  )}
                </span>
                <span className="space-y-1.5 p-3">
                  <span title={file.name} className="block truncate text-sm font-medium">
                    {file.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatFileSize(file.size, language)} ·{' '}
                    {formatDate(file.updatedAt, language, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <FileBadges file={file} />
                </span>
              </button>
              {canManage ? (
                <div className="flex justify-end border-t px-2 py-1">
                  <Popconfirm
                    title={t('list.deleteTitle')}
                    description={t('list.deleteDescription', { name: file.name })}
                    confirmLabel={t('actions.delete')}
                    destructive
                    pending={deletingId === file.id}
                    onConfirm={() => onDelete(file)}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t('list.delete', { name: file.name })}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </Popconfirm>
                </div>
              ) : null}
            </div>
          </FileContextMenu>
        )
      })}
    </div>
  )
}
