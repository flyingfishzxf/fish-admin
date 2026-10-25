import { Pencil, Star, Trash2 } from 'lucide-react'
import { useState, useRef, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Carousel } from '@/components/enterprise/carousel/carousel'
import { Cascader } from '@/components/enterprise/cascader/cascader'
import { JsonViewer } from '@/components/enterprise/json-viewer/json-viewer'
import { Popconfirm } from '@/components/enterprise/popconfirm/popconfirm'
import { Watermark } from '@/components/enterprise/watermark/watermark'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { WorkspaceFile } from '@/types'

import type { FileFolderSummary } from '../api'
import { fileIcon, formatFileSize, isPreviewable } from '../file-meta'
import { folderCascaderOptions, folderPathIds } from '../folder-utils'

export function FilePreviewPanel({
  file,
  images,
  folders,
  language,
  canManage,
  deleting = false,
  onToggleFavorite,
  onMove,
  onRename,
  onVisibilityChange,
  onDelete,
}: {
  file: WorkspaceFile | null
  images: WorkspaceFile[]
  folders: FileFolderSummary[]
  language: string
  canManage: boolean
  deleting?: boolean
  onToggleFavorite: (file: WorkspaceFile) => void
  onMove: (file: WorkspaceFile, folderId: string) => Promise<void>
  onRename: (file: WorkspaceFile, name: string) => Promise<boolean>
  onVisibilityChange: (file: WorkspaceFile, visibility: WorkspaceFile['visibility']) => void
  onDelete: (file: WorkspaceFile) => void
}) {
  const { t } = useTranslation('files')
  const [renameOpen, setRenameOpen] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [draftName, setDraftName] = useState('')
  const [saving, setSaving] = useState(false)

  if (!file) {
    return (
      <EmptyState
        icon={fileIcon({ mime: 'application/octet-stream' })}
        title={t('preview.emptyTitle')}
        description={t('preview.emptyDescription')}
        className="h-full"
      />
    )
  }

  const Icon = fileIcon(file)
  const metadata = {
    id: file.id,
    name: file.name,
    mime: file.mime,
    size: file.size,
    sizeLabel: formatFileSize(file.size, language),
    folder: folderPathIds(folders, file.folderId)
      .map((id) => folders.find((folder) => folder.id === id)?.name)
      .filter(Boolean)
      .join(' / '),
    visibility: file.visibility,
    favorite: file.favorite,
    uploadedBy: file.uploadedByName,
    updatedAt: file.updatedAt,
    preview: isPreviewable(file) ? 'embedded data URL' : 'metadata only',
  }

  const openRename = () => {
    setDraftName(file.name)
    setRenameOpen(true)
  }

  const submitRename = async (event: FormEvent) => {
    event.preventDefault()
    const name = draftName.trim()
    if (!name || name === file.name) {
      setRenameOpen(false)
      return
    }
    setSaving(true)
    try {
      const saved = await onRename(file, name)
      if (saved) setRenameOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {isPreviewable(file) ? (
              <img src={file.dataUrl} alt="" className="size-full object-cover" />
            ) : (
              <Icon aria-hidden className="size-4 text-muted-foreground" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size, language)} ·{' '}
              {formatDate(file.updatedAt, language, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {canManage ? (
            <>
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
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('preview.rename')}
                onClick={openRename}
              >
                <Pencil aria-hidden className="size-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Watermark
        text={t('preview.watermark', { name: file.uploadedByName })}
        className="overflow-hidden rounded-xl border"
      >
        {isPreviewable(file) ? (
          <img
            src={file.dataUrl}
            alt={file.name}
            className="max-h-72 w-full bg-muted/30 object-contain"
          />
        ) : (
          <div className="flex h-44 flex-col items-center justify-center gap-2 bg-muted/30">
            <Icon aria-hidden className="size-10 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t('preview.noPreview')}</p>
          </div>
        )}
      </Watermark>

      <JsonViewer value={metadata} ariaLabel={t('preview.metadata')} defaultExpandedDepth={1} />

      {canManage ? (
        <div className="space-y-3 rounded-xl border p-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t('preview.move')}</p>
            <Cascader
              options={folderCascaderOptions(folders)}
              value={folderPathIds(folders, file.folderId)}
              onChange={(path) => {
                const folderId = path[path.length - 1]
                if (!folderId || folderId === file.folderId) return
                void onMove(file, folderId)
              }}
              placeholder={t('preview.movePlaceholder')}
              ariaLabel={t('preview.moveAria')}
              clearLabel={t('preview.clearFolder')}
              emptyLabel={t('preview.noFolders')}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t('preview.visibility')}</p>
              <p className="text-xs text-muted-foreground">{t('preview.visibilityHelp')}</p>
            </div>
            <Switch
              checked={file.visibility === 'team'}
              onCheckedChange={(checked) => onVisibilityChange(file, checked ? 'team' : 'private')}
              aria-label={t('preview.visibility')}
            />
          </div>
          <Popconfirm
            title={t('preview.deleteTitle')}
            description={t('preview.deleteDescription', { name: file.name })}
            confirmLabel={t('actions.delete')}
            destructive
            pending={deleting}
            onConfirm={() => onDelete(file)}
          >
            <Button type="button" variant="destructive" size="sm" className="w-full">
              <Trash2 aria-hidden className="size-4" />
              {t('actions.delete')}
            </Button>
          </Popconfirm>
        </div>
      ) : null}

      {images.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('preview.gallery')}</p>
          <Carousel
            slides={images.map((image) => ({
              id: image.id,
              image: image.dataUrl,
              alt: image.name,
              title: image.name,
              description: formatDateTime(image.updatedAt, language),
            }))}
            ariaLabel={t('preview.carouselAria')}
            previousLabel={t('preview.previous')}
            nextLabel={t('preview.next')}
            goToLabel={(index) => t('preview.goTo', { index })}
          />
        </div>
      ) : null}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            renameInputRef.current?.focus()
          }}
        >
          <form onSubmit={submitRename} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t('preview.renameTitle')}</DialogTitle>
              <DialogDescription>{t('preview.renameDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="file-rename">{t('preview.renameLabel')}</Label>
              <Input
                id="file-rename"
                ref={renameInputRef}
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder={t('preview.renamePlaceholder')}
                maxLength={80}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
                {t('preview.cancel')}
              </Button>
              <Button type="submit" disabled={saving || !draftName.trim()}>
                {t('preview.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
