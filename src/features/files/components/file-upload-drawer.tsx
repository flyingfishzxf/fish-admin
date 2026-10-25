import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Combobox } from '@/components/enterprise/combobox/combobox'
import {
  ImagePreview,
  type PreviewImage,
} from '@/components/enterprise/image-preview/image-preview'
import { Upload, type UploadItem } from '@/components/enterprise/upload/upload'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type { WorkspaceFile } from '@/types'

import { uploadFile } from '../api'
import type { FileFolderSummary } from '../api'
import { flattenFolders } from '../folder-utils'

const MAX_DATA_URL = 256_000
const MAX_FILE_SIZE = 25 * 1024 * 1024

function readPreview(file: File) {
  if (file.size > MAX_DATA_URL || !file.type.startsWith('image/')) {
    return Promise.resolve<string | undefined>(undefined)
  }
  return new Promise<string | undefined>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined)
    reader.onerror = () => resolve(undefined)
    reader.readAsDataURL(file)
  })
}

export function FileUploadDrawer({
  open,
  onOpenChange,
  folders,
  defaultFolderId,
  onUploaded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: FileFolderSummary[]
  defaultFolderId?: string
  onUploaded: (file: WorkspaceFile) => void
}) {
  const { t } = useTranslation('files')
  const queryClient = useQueryClient()
  const folderOptions = useMemo(() => flattenFolders(folders), [folders])
  const [folderId, setFolderId] = useState(defaultFolderId ?? folderOptions[0]?.value ?? '')
  const [items, setItems] = useState<UploadItem[]>([])
  const [previews, setPreviews] = useState<PreviewImage[]>([])
  const filesRef = useRef(new Map<string, File>())

  useEffect(() => {
    if (!open) return
    setFolderId((current) => {
      if (current && folders.some((folder) => folder.id === current)) return current
      return defaultFolderId ?? folderOptions[0]?.value ?? ''
    })
  }, [open, defaultFolderId, folders, folderOptions])

  const patchItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  async function startUpload(id: string, file: File) {
    patchItem(id, { status: 'uploading', progress: 20, error: undefined })
    try {
      const dataUrl = await readPreview(file)
      patchItem(id, { progress: 65 })
      const uploaded = await uploadFile({
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        folderId,
        dataUrl,
      })
      patchItem(id, { status: 'done', progress: 100 })
      filesRef.current.delete(id)
      const previewSrc = uploaded.dataUrl
      if (previewSrc) {
        setPreviews((current) => [
          ...current,
          { src: previewSrc, alt: uploaded.name, caption: uploaded.name },
        ])
      }
      await queryClient.invalidateQueries({ queryKey: ['files'] })
      onUploaded(uploaded)
      toast.success(t('toasts.uploaded'))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('upload.error', { name: file.name })
      patchItem(id, { status: 'error', progress: 100, error: message })
      toast.error(message)
    }
  }

  const handleFiles = (files: File[]) => {
    if (!folderId) return
    for (const file of files) {
      const id = crypto.randomUUID()
      filesRef.current.set(id, file)
      setItems((current) => [
        ...current,
        { id, name: file.name, size: file.size, status: 'uploading', progress: 20 },
      ])
      void startUpload(id, file)
    }
  }

  const handleRetry = (item: UploadItem) => {
    const file = filesRef.current.get(item.id)
    if (!file) {
      patchItem(item.id, { error: t('upload.retryUnavailable') })
      return
    }
    void startUpload(item.id, file)
  }

  const handleRemove = (item: UploadItem) => {
    filesRef.current.delete(item.id)
    setItems((current) => current.filter((entry) => entry.id !== item.id))
  }

  const doneCount = items.filter((item) => item.status === 'done').length

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="border-b">
          <DrawerTitle>{t('upload.title')}</DrawerTitle>
          <DrawerDescription>{t('upload.description')}</DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t('upload.destination')}</p>
            <Combobox
              options={folderOptions}
              value={folderId || null}
              onChange={setFolderId}
              placeholder={t('upload.chooseFolder')}
              searchPlaceholder={t('upload.searchFolder')}
              emptyLabel={t('upload.noFolder')}
              ariaLabel={t('upload.destination')}
              disabled={folderOptions.length === 0}
            />
          </div>
          <Upload
            items={items}
            onFiles={handleFiles}
            onRemove={handleRemove}
            onRetry={handleRetry}
            accept="image/*,.pdf,.md,.csv,.json"
            label={t('upload.dropLabel')}
            hint={t('upload.dropHint')}
            browseLabel={t('upload.browse')}
            maxSize={MAX_FILE_SIZE}
            maxSizeLabel={t('upload.maxSize')}
            removeLabel={(item) => t('upload.remove', { name: item.name })}
            retryLabel={t('upload.retry')}
            disabled={!folderId}
          />
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('upload.empty')}</p>
          ) : null}
          {previews.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('upload.previews')}</p>
              <ImagePreview images={previews.slice(-6)} ariaLabel={t('upload.previewsAria')} />
            </div>
          ) : null}
        </div>
        <DrawerFooter className="border-t">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {t('upload.doneCount', { count: doneCount })}
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('upload.close')}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
