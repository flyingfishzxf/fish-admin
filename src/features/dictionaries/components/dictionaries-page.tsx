import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BookMarked, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/error-state'
import { PageContainer } from '@/components/enterprise/page-container/page-container'
import { Popconfirm } from '@/components/enterprise/popconfirm/popconfirm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { PERMISSION_CODES } from '@/config/permissions'
import { ApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import type { DictionaryItem, DictionaryType } from '@/types'
import { useCan } from '@/hooks/use-can'

import {
  deleteDictionary,
  deleteDictionaryItem,
  reorderDictionaryItems,
  updateDictionaryItem,
} from '../api'
import { dictionaryKeys, useDictionaryDetailQuery, useDictionaryListQuery } from '../queries'
import { DictionaryItemDialog } from './dictionary-item-dialog'
import { DictionaryItemsTable } from './dictionary-items-table'
import { DictionaryTypeDialog } from './dictionary-type-dialog'

const SEEDED_TYPE_CODES = new Set(['user_tag', 'expense_category', 'approval_priority'])

function errorMessage(
  error: unknown,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (!(error instanceof ApiError)) return t('dictionaries:errors.unknown')
  if (error.code === 'DICTIONARY_NOT_EMPTY') return t('dictionaries:errors.notEmpty')
  if (error.code === 'DICTIONARY_PROTECTED' || error.code === 'ITEM_PROTECTED') {
    return t('dictionaries:errors.protected')
  }
  if (error.code === 'ITEM_IN_USE') return t('dictionaries:errors.inUse')
  if (error.code === 'DICTIONARY_NOT_FOUND' || error.code === 'ITEM_NOT_FOUND') {
    return t('dictionaries:errors.notFound')
  }
  return t('dictionaries:errors.unknown')
}

export function DictionariesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const canManage = useCan(PERMISSION_CODES.dictionaryManage)
  const list = useDictionaryListQuery()
  const [selectedId, setSelectedId] = useState<string>()
  const [typeDialog, setTypeDialog] = useState<{ open: boolean; type: DictionaryType | null }>({
    open: false,
    type: null,
  })
  const [itemDialog, setItemDialog] = useState<{
    open: boolean
    item: DictionaryItem | null
  }>({ open: false, item: null })
  const [pendingItemId, setPendingItemId] = useState<string>()

  useEffect(() => {
    if (!list.data?.length) {
      setSelectedId(undefined)
      return
    }
    if (!selectedId || !list.data.some((type) => type.id === selectedId)) {
      setSelectedId(list.data[0]?.id)
    }
  }, [list.data, selectedId])

  const detail = useDictionaryDetailQuery(selectedId)
  const dictionary = detail.data?.dictionary
  const items = detail.data?.items ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: dictionaryKeys.all })

  const toggleMutation = useMutation({
    mutationFn: ({ item, enabled }: { item: DictionaryItem; enabled: boolean }) =>
      updateDictionaryItem(item.dictionaryId, item.id, { enabled }),
    onMutate: ({ item }) => setPendingItemId(item.id),
    onSuccess: (_data, { item, enabled }) => {
      void invalidate()
      toast.success(
        t(enabled ? 'dictionaries:item.enabledToast' : 'dictionaries:item.disabledToast', {
          label: item.label,
        }),
      )
    },
    onError: (error) => toast.error(errorMessage(error, t)),
    onSettled: () => setPendingItemId(undefined),
  })

  const deleteItemMutation = useMutation({
    mutationFn: (item: DictionaryItem) => deleteDictionaryItem(item.dictionaryId, item.id),
    onSuccess: () => {
      void invalidate()
      toast.success(t('dictionaries:item.deleted'))
    },
    onError: (error) => toast.error(errorMessage(error, t)),
  })

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => {
      if (!dictionary) throw new Error('Missing dictionary')
      return reorderDictionaryItems(dictionary.id, ids)
    },
    onSuccess: () => void invalidate(),
    onError: (error) => toast.error(errorMessage(error, t)),
  })

  const deleteTypeMutation = useMutation({
    mutationFn: (type: DictionaryType) => deleteDictionary(type.id),
    onSuccess: () => {
      void invalidate()
      toast.success(t('dictionaries:type.deleted'))
      setSelectedId(undefined)
    },
    onError: (error) => toast.error(errorMessage(error, t)),
  })

  function typeName(type: DictionaryType) {
    return SEEDED_TYPE_CODES.has(type.code)
      ? t(`dictionaries:seedTypes.${type.code}.name`, { defaultValue: type.name })
      : type.name
  }

  function typeDescription(type: DictionaryType) {
    return SEEDED_TYPE_CODES.has(type.code)
      ? t(`dictionaries:seedTypes.${type.code}.description`, { defaultValue: type.description })
      : type.description
  }

  return (
    <PageContainer
      title={t('dictionaries:title')}
      description={t('dictionaries:description')}
      actions={
        canManage ? (
          <Button onClick={() => setTypeDialog({ open: true, type: null })}>
            <Plus className="size-4" />
            {t('dictionaries:newType')}
          </Button>
        ) : null
      }
    >
      <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-sm">{t('dictionaries:typesTitle')}</CardTitle>
            <CardDescription>
              {t('dictionaries:typeCount', { count: list.data?.length ?? 0 })}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            {list.isPending ? (
              <div className="space-y-2 px-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : list.isError ? (
              <ErrorState className="border-0 px-2 py-8" onRetry={() => void list.refetch()} />
            ) : (
              <ul className="space-y-1" aria-label={t('dictionaries:typesTitle')}>
                {list.data?.map((type) => {
                  const active = type.id === selectedId
                  return (
                    <li key={type.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedId(type.id)}
                        className={cn(
                          'flex w-full flex-col gap-1 rounded-md px-2.5 py-2 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
                          active && 'bg-accent',
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{typeName(type)}</span>
                          <Badge variant={active ? 'default' : 'secondary'}>{type.itemCount}</Badge>
                        </span>
                        <span className="flex items-center gap-2">
                          <code className="truncate text-xs text-muted-foreground">
                            {type.code}
                          </code>
                          {type.referenceCount > 0 ? (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {t('dictionaries:type.references', { count: type.referenceCount })}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {!selectedId ? (
          <Card>
            <CardContent className="flex min-h-72 items-center justify-center">
              <Empty>
                <EmptyMedia variant="icon">
                  <BookMarked />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>{t('dictionaries:empty.title')}</EmptyTitle>
                  <EmptyDescription>{t('dictionaries:empty.description')}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : detail.isPending ? (
          <Card>
            <CardContent className="space-y-3 pt-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ) : detail.isError || !dictionary ? (
          <Card>
            <CardContent className="pt-2">
              <ErrorState onRetry={() => void detail.refetch()} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                    {typeName(dictionary)}
                    <Badge variant="outline">{dictionary.code}</Badge>
                    {dictionary.isSystem ? (
                      <Badge variant="secondary">{t('dictionaries:type.system')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('dictionaries:type.custom')}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{typeDescription(dictionary)}</CardDescription>
                  <p className="text-xs text-muted-foreground">
                    {t(`dictionaries:usage.${dictionary.code}`, {
                      defaultValue: t('dictionaries:usage.none'),
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canManage && !dictionary.isSystem ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTypeDialog({ open: true, type: dictionary })}
                      >
                        <Pencil className="size-4" />
                        {t('dictionaries:type.edit')}
                      </Button>
                      <Popconfirm
                        title={t('dictionaries:type.deleteTitle', { name: typeName(dictionary) })}
                        description={
                          dictionary.itemCount > 0
                            ? t('dictionaries:errors.notEmpty')
                            : t('dictionaries:type.deleteDescription')
                        }
                        destructive
                        disabled={dictionary.itemCount > 0}
                        onConfirm={() => deleteTypeMutation.mutate(dictionary)}
                        confirmLabel={t('common:actions.delete')}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          disabled={dictionary.itemCount > 0}
                          title={
                            dictionary.itemCount > 0 ? t('dictionaries:errors.notEmpty') : undefined
                          }
                        >
                          <Trash2 className="size-4" />
                          {t('dictionaries:type.delete')}
                        </Button>
                      </Popconfirm>
                    </>
                  ) : null}
                  {canManage ? (
                    <Button size="sm" onClick={() => setItemDialog({ open: true, item: null })}>
                      <Plus className="size-4" />
                      {t('dictionaries:item.new')}
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DictionaryItemsTable
                items={items}
                canManage={canManage}
                pendingItemId={pendingItemId}
                onEdit={(item) => setItemDialog({ open: true, item })}
                onDelete={(item) => deleteItemMutation.mutate(item)}
                onToggle={(item, enabled) => toggleMutation.mutate({ item, enabled })}
                onReorder={(ids) => reorderMutation.mutate(ids)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <DictionaryTypeDialog
        open={typeDialog.open}
        type={typeDialog.type}
        onOpenChange={(open) => setTypeDialog((current) => ({ ...current, open }))}
        onCreated={(id) => setSelectedId(id)}
      />
      <DictionaryItemDialog
        open={itemDialog.open}
        dictionaryId={dictionary?.id ?? ''}
        item={itemDialog.item}
        onOpenChange={(open) => setItemDialog((current) => ({ ...current, open }))}
      />
    </PageContainer>
  )
}
