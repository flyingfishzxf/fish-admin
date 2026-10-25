import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Folder,
  FolderOpen,
  LayoutGrid,
  List,
  Plus,
  Star,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { AutoComplete } from '@/components/enterprise/auto-complete/auto-complete'
import { Combobox } from '@/components/enterprise/combobox/combobox'
import { DatePicker } from '@/components/enterprise/date-picker/date-picker'
import { PageContainer } from '@/components/enterprise/page-container/page-container'
import { Popconfirm } from '@/components/enterprise/popconfirm/popconfirm'
import { Tree, type TreeItem } from '@/components/enterprise/tree/tree'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Segmented } from '@/components/ui/segmented'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Toggle } from '@/components/ui/toggle'
import { PERMISSION_CODES } from '@/config/permissions'
import { useCan } from '@/hooks/use-can'
import { useIsCompact } from '@/hooks/use-mobile'
import { useDocumentTitle } from '@/lib/document-title'
import { treePath } from '@/lib/tree'
import type { WorkspaceFile } from '@/types'

import { deleteFile, deleteFiles, updateFile, type FileUpdateInput } from '../api'
import { isPreviewable } from '../file-meta'
import type { FilesSearch, FileKind, FileVisibilityFilter } from '../search'
import { useFileFoldersQuery, useFileListQuery } from '../queries'
import { FileList } from './file-list'
import { FilePreviewPanel } from './file-preview-panel'
import { FileUploadDrawer } from './file-upload-drawer'

type PageToken = number | 'start-ellipsis' | 'end-ellipsis'

function pageTokens(current: number, count: number): PageToken[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)

  const start = Math.max(2, current - 1)
  const end = Math.min(count - 1, current + 1)
  const tokens: PageToken[] = [1]
  if (start > 2) tokens.push('start-ellipsis')
  for (let page = start; page <= end; page += 1) tokens.push(page)
  if (end < count - 1) tokens.push('end-ellipsis')
  tokens.push(count)
  return tokens
}

export function FilesPage({
  search,
  onSearchChange,
}: {
  search: FilesSearch
  onSearchChange: (updater: (previous: FilesSearch) => FilesSearch) => void
}) {
  const { t, i18n } = useTranslation('files')
  const queryClient = useQueryClient()
  const isCompact = useIsCompact()
  const canManage = useCan(PERMISSION_CODES.fileManage)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  useDocumentTitle(t('title'))

  const foldersQuery = useFileFoldersQuery()
  const params = useMemo(
    () => ({
      page: search.page,
      pageSize: search.pageSize,
      folderId: search.folderId,
      q: search.q,
      kind: search.kind,
      visibility: search.visibility === 'all' ? undefined : search.visibility,
      favorite: search.favorite,
      sort: search.sort,
      order: search.order,
      updatedAfter: search.updatedAfter,
    }),
    [
      search.page,
      search.pageSize,
      search.folderId,
      search.q,
      search.kind,
      search.visibility,
      search.favorite,
      search.sort,
      search.order,
      search.updatedAfter,
    ],
  )
  const listQuery = useFileListQuery(params)

  const files = useMemo(() => listQuery.data?.items ?? [], [listQuery.data])
  const pageCount = listQuery.data?.pageCount ?? 1
  const folders = foldersQuery.data?.folders ?? []
  const selectedFile = files.find((file) => file.id === selectedId) ?? null
  const images = files.filter((file) => isPreviewable(file))
  const breadcrumbPath = search.folderId ? treePath(folders, search.folderId) : []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['files'] })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FileUpdateInput }) => updateFile(id, input),
    onSuccess: () => invalidate(),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('errors.update'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: (_data, id) => {
      toast.success(t('toasts.deleted'))
      setSelectedIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
      void invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('errors.delete'))
    },
  })

  const bulkMutation = useMutation({
    mutationFn: deleteFiles,
    onSuccess: (result) => {
      toast.success(t('toasts.bulkDeleted', { count: result.deleted }))
      setSelectedIds(new Set())
      void invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('errors.delete'))
    },
  })

  useEffect(() => {
    setSelectedIds(new Set())
  }, [
    search.page,
    search.folderId,
    search.q,
    search.kind,
    search.visibility,
    search.favorite,
    search.updatedAfter,
  ])

  useEffect(() => {
    if (files.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !files.some((file) => file.id === selectedId)) {
      setSelectedId(files[0]?.id ?? null)
    }
  }, [files, selectedId])

  const changeFilters = (patch: Partial<FilesSearch>) => {
    onSearchChange((previous) => ({ ...previous, page: 1, ...patch }))
  }

  const selectFolder = (folderId?: string) => {
    changeFilters({ folderId })
  }

  const openFile = (file: WorkspaceFile) => {
    setSelectedId(file.id)
    if (isCompact) setPreviewOpen(true)
  }

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(files.map((file) => file.id)) : new Set())
  }

  const toggleFavorite = (file: WorkspaceFile) => {
    updateMutation.mutate(
      { id: file.id, input: { favorite: !file.favorite } },
      {
        onSuccess: () =>
          toast.success(file.favorite ? t('toasts.favoriteRemoved') : t('toasts.favoriteAdded')),
      },
    )
  }

  const moveFile = (file: WorkspaceFile, folderId: string) =>
    updateMutation
      .mutateAsync({ id: file.id, input: { folderId } })
      .then(() => {
        toast.success(t('toasts.moved'))
      })
      .catch(() => undefined)

  const renameFile = async (file: WorkspaceFile, name: string) => {
    try {
      await updateMutation.mutateAsync({ id: file.id, input: { name } })
      toast.success(t('toasts.updated'))
      return true
    } catch {
      return false
    }
  }

  const changeVisibility = (file: WorkspaceFile, visibility: WorkspaceFile['visibility']) => {
    updateMutation.mutate(
      { id: file.id, input: { visibility } },
      { onSuccess: () => toast.success(t('toasts.updated')) },
    )
  }

  const copyName = (file: WorkspaceFile) => {
    navigator.clipboard
      ?.writeText(file.name)
      .then(() => toast.success(t('toasts.copied')))
      .catch(() => toast.error(t('toasts.copyFailed')))
  }

  const treeItems: TreeItem[] = folders.map((folder) => ({
    id: folder.id,
    parentId: folder.parentId,
    label: folder.name,
    badge: String(folder.fileCount),
    icon: Folder,
  }))

  const kindOptions = (['all', 'image', 'document', 'data'] as FileKind[]).map((kind) => ({
    value: kind,
    label: t(`filters.kinds.${kind}`),
  }))

  const visibilityOptions = (['all', 'team', 'private'] as FileVisibilityFilter[]).map(
    (visibility) => ({
      value: visibility,
      label: t(`filters.visibilities.${visibility}`),
    }),
  )

  const pagination =
    pageCount > 1 ? (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={search.page <= 1}
              className={search.page <= 1 ? 'pointer-events-none opacity-50' : undefined}
              onClick={(event) => {
                event.preventDefault()
                if (search.page > 1) onSearchChange((prev) => ({ ...prev, page: prev.page - 1 }))
              }}
            />
          </PaginationItem>
          {pageTokens(search.page, pageCount).map((token) =>
            typeof token === 'number' ? (
              <PaginationItem key={token}>
                <PaginationLink
                  href="#"
                  isActive={token === search.page}
                  onClick={(event) => {
                    event.preventDefault()
                    onSearchChange((prev) => ({ ...prev, page: token }))
                  }}
                >
                  {token}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={token}>
                <PaginationEllipsis />
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={search.page >= pageCount}
              className={search.page >= pageCount ? 'pointer-events-none opacity-50' : undefined}
              onClick={(event) => {
                event.preventDefault()
                if (search.page < pageCount)
                  onSearchChange((prev) => ({ ...prev, page: prev.page + 1 }))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    ) : null

  const previewPanel = (
    <FilePreviewPanel
      file={selectedFile}
      images={images}
      folders={folders}
      language={i18n.language}
      canManage={canManage}
      deleting={deleteMutation.isPending && deleteMutation.variables === selectedFile?.id}
      onToggleFavorite={toggleFavorite}
      onMove={moveFile}
      onRename={renameFile}
      onVisibilityChange={changeVisibility}
      onDelete={(file) => deleteMutation.mutate(file.id)}
    />
  )

  const listContent = listQuery.isLoading ? (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-56 w-full" />
      ))}
    </div>
  ) : listQuery.isError ? (
    <ErrorState onRetry={() => void listQuery.refetch()} />
  ) : files.length === 0 ? (
    <EmptyState
      icon={FolderOpen}
      title={t('list.emptyTitle')}
      description={t('list.emptyDescription')}
      action={
        canManage ? (
          <Button onClick={() => setUploadOpen(true)}>
            <UploadCloud aria-hidden className="size-4" />
            {t('actions.upload')}
          </Button>
        ) : undefined
      }
    />
  ) : (
    <FileList
      files={files}
      view={search.view}
      selectedId={selectedId}
      selectedIds={selectedIds}
      canManage={canManage}
      language={i18n.language}
      onOpen={openFile}
      onToggleSelected={toggleSelected}
      onToggleAll={toggleAll}
      onToggleFavorite={toggleFavorite}
      onCopyName={copyName}
      onDelete={(file) => deleteMutation.mutate(file.id)}
      deletingId={deleteMutation.isPending ? deleteMutation.variables : undefined}
    />
  )

  return (
    <PageContainer
      title={t('title')}
      description={t('subtitle')}
      actions={
        canManage ? (
          <Button onClick={() => setUploadOpen(true)}>
            <Plus aria-hidden className="size-4" />
            {t('actions.upload')}
          </Button>
        ) : null
      }
    >
      {selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2">
          <p className="text-sm font-medium">{t('selection.count', { count: selectedIds.size })}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              <X aria-hidden className="size-4" />
              {t('selection.clear')}
            </Button>
            {canManage ? (
              <Popconfirm
                title={t('selection.deleteTitle')}
                description={t('selection.deleteDescription', { count: selectedIds.size })}
                confirmLabel={t('actions.delete')}
                destructive
                pending={bulkMutation.isPending}
                onConfirm={() => bulkMutation.mutate([...selectedIds])}
              >
                <Button variant="destructive" size="sm">
                  <Trash2 aria-hidden className="size-4" />
                  {t('selection.delete', { count: selectedIds.size })}
                </Button>
              </Popconfirm>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('folders.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Button
              variant={!search.folderId ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => selectFolder(undefined)}
            >
              <FolderOpen aria-hidden className="size-4" />
              {t('folders.all')}
              <span className="ml-auto text-xs text-muted-foreground">
                {foldersQuery.data?.total ?? 0}
              </span>
            </Button>
            {foldersQuery.isLoading ? (
              <div className="space-y-2 px-1 py-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-7 w-full" />
                ))}
              </div>
            ) : foldersQuery.isError ? (
              <ErrorState onRetry={() => void foldersQuery.refetch()} />
            ) : (
              <Tree
                items={treeItems}
                selectedId={search.folderId ?? null}
                onSelect={(id) => selectFolder(id)}
                ariaLabel={t('folders.ariaLabel')}
                emptyLabel={t('folders.empty')}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <button type="button" onClick={() => selectFolder(undefined)}>
                        {t('title')}
                      </button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {breadcrumbPath.map((folder, index) => (
                    <Fragment key={folder.id}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {index === breadcrumbPath.length - 1 ? (
                          <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <button type="button" onClick={() => selectFolder(folder.id)}>
                              {folder.name}
                            </button>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                  {search.favorite ? (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{t('folders.favorites')}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  ) : null}
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex items-center gap-2">
                {listQuery.isFetching ? <Spinner label={t('list.loading')} /> : null}
                <Segmented
                  aria-label={t('filters.viewAria')}
                  value={search.view}
                  onValueChange={(value) =>
                    changeFilters({ view: value === 'list' ? 'list' : 'grid' })
                  }
                  options={[
                    { value: 'grid', label: t('filters.viewGrid'), icon: LayoutGrid },
                    { value: 'list', label: t('filters.viewList'), icon: List },
                  ]}
                  size="sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-52 flex-1">
                <AutoComplete
                  options={files.map((file) => ({ value: file.id, label: file.name }))}
                  value={search.q ?? ''}
                  onValueChange={(value) => changeFilters({ q: value.trim() || undefined })}
                  placeholder={t('filters.searchPlaceholder')}
                  ariaLabel={t('filters.searchAria')}
                  emptyLabel={t('filters.noSuggestions')}
                />
              </div>
              <Combobox
                options={kindOptions}
                value={search.kind}
                onChange={(value) => changeFilters({ kind: value as FileKind })}
                placeholder={t('filters.kind')}
                searchPlaceholder={t('filters.kindSearch')}
                emptyLabel={t('filters.noMatches')}
                ariaLabel={t('filters.kindAria')}
                className="w-36"
              />
              <Combobox
                options={visibilityOptions}
                value={search.visibility}
                onChange={(value) => changeFilters({ visibility: value as FileVisibilityFilter })}
                placeholder={t('filters.visibility')}
                searchPlaceholder={t('filters.visibilitySearch')}
                emptyLabel={t('filters.noMatches')}
                ariaLabel={t('filters.visibilityAria')}
                className="w-36"
              />
              <div className="flex items-center gap-1">
                <DatePicker
                  value={search.updatedAfter}
                  onChange={(value) => changeFilters({ updatedAfter: value })}
                  placeholder={t('filters.updatedAfter')}
                  ariaLabel={t('filters.updatedAfter')}
                  max={new Date().toISOString().slice(0, 10)}
                />
                {search.updatedAfter ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('filters.clearDate')}
                    onClick={() => changeFilters({ updatedAfter: undefined })}
                  >
                    <X aria-hidden className="size-4" />
                  </Button>
                ) : null}
              </div>
              <Toggle
                variant="outline"
                pressed={search.favorite}
                aria-label={t('filters.favorite')}
                onPressedChange={(pressed) => changeFilters({ favorite: pressed })}
              >
                <Star aria-hidden className="size-4" />
                {t('filters.favorite')}
              </Toggle>
            </div>

            {isCompact ? (
              <>
                <div className="@container">{listContent}</div>
                {pagination ? <div className="pt-2">{pagination}</div> : null}
              </>
            ) : (
              // The group sizes itself with an inline height:100%, so the definite
              // height has to come from its parent for the panes to scroll.
              <div className="h-[560px]">
                <ResizablePanelGroup
                  orientation="horizontal"
                  className="overflow-hidden rounded-xl border"
                >
                  <ResizablePanel defaultSize={58} minSize={36} className="min-w-0">
                    <div className="flex h-full flex-col">
                      <ScrollArea className="min-h-0 flex-1">
                        <div className="@container p-3">{listContent}</div>
                      </ScrollArea>
                      {pagination ? <div className="border-t p-3">{pagination}</div> : null}
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={42} minSize={28} className="min-w-0">
                    <ScrollArea className="h-full">
                      <div className="p-4">{previewPanel}</div>
                    </ScrollArea>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Drawer direction="right" open={previewOpen} onOpenChange={setPreviewOpen}>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <DrawerTitle>{t('preview.title')}</DrawerTitle>
                <DrawerDescription>
                  {selectedFile?.name ?? t('preview.emptyTitle')}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon-sm" aria-label={t('common:close')}>
                  <X aria-hidden className="size-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">{previewPanel}</div>
        </DrawerContent>
      </Drawer>

      <FileUploadDrawer
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        folders={folders}
        defaultFolderId={search.folderId}
        onUploaded={(file) => {
          setSelectedId(file.id)
          void invalidate()
        }}
      />
    </PageContainer>
  )
}
