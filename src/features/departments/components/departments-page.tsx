import { Network, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PERMISSION_CODES } from '@/config/permissions'
import { useCan } from '@/hooks/use-can'
import { useDocumentTitle } from '@/lib/document-title'

import { useDepartmentsQuery } from '../queries'
import type { DepartmentsSearch } from '../search'
import { DepartmentDetail } from './department-detail'
import { DepartmentFormDialog } from './department-form-dialog'
import { DepartmentTreePanel } from './department-tree-panel'

type DialogState =
  { mode: 'create'; parentId: string | null } | { mode: 'rename'; departmentId: string }

export function DepartmentsPage({
  search,
  onSearchChange,
}: {
  search: DepartmentsSearch
  onSearchChange: (updater: (previous: DepartmentsSearch) => DepartmentsSearch) => void
}) {
  const { t } = useTranslation()
  useDocumentTitle(t('departments:title'))
  const query = useDepartmentsQuery()
  const canManage = useCan(PERMISSION_CODES.departmentManage)
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const departments = useMemo(() => query.data ?? [], [query.data])
  const selected = departments.find((department) => department.id === search.dept)

  const selectDepartment = useCallback(
    (id: string) => {
      onSearchChange((previous) => ({ ...previous, dept: id }))
    },
    [onSearchChange],
  )

  useEffect(() => {
    if (query.isPending || query.isFetching || departments.length === 0) return
    if (selected) return
    const fallback =
      departments.find((department) => department.parentId === null) ?? departments[0]
    if (fallback) selectDepartment(fallback.id)
  }, [query.isPending, query.isFetching, departments, selected, selectDepartment])

  const dialogParent =
    dialog?.mode === 'create' && dialog.parentId
      ? (departments.find((department) => department.id === dialog.parentId) ?? null)
      : null
  const dialogDepartment =
    dialog?.mode === 'rename'
      ? (departments.find((department) => department.id === dialog.departmentId) ?? null)
      : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('departments:title')}
        description={t('departments:subtitle')}
        actions={
          canManage ? (
            <Button onClick={() => setDialog({ mode: 'create', parentId: null })}>
              <Plus className="size-4" />
              {t('departments:newDepartment')}
            </Button>
          ) : null
        }
      />

      {!canManage ? (
        <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {t('departments:readOnly')}
        </p>
      ) : null}

      {query.isPending ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[26rem] rounded-2xl lg:col-span-1" />
          <Skeleton className="h-[26rem] rounded-2xl lg:col-span-2" />
        </div>
      ) : query.isError ? (
        <ErrorState title={t('departments:loadError')} onRetry={() => void query.refetch()} />
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Network}
          title={t('departments:treeEmpty')}
          description={t('departments:subtitle')}
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-1">
            <DepartmentTreePanel
              departments={departments}
              selectedId={selected?.id}
              onSelect={selectDepartment}
            />
          </div>

          <div className="min-w-0 lg:col-span-2">
            {selected ? (
              <DepartmentDetail
                key={selected.id}
                department={selected}
                departments={departments}
                canManage={canManage}
                onNewChild={() => setDialog({ mode: 'create', parentId: selected.id })}
                onRename={() => setDialog({ mode: 'rename', departmentId: selected.id })}
              />
            ) : (
              <Card className="shadow-soft">
                <CardContent className="flex min-h-[20rem] items-center justify-center p-8 text-center text-sm text-muted-foreground">
                  {t('departments:noSelection')}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <DepartmentFormDialog
        open={Boolean(dialog)}
        onOpenChange={(open) => !open && setDialog(null)}
        mode={dialog?.mode ?? 'create'}
        parent={dialogParent}
        department={dialogDepartment}
        onCreated={(created) => selectDepartment(created.id)}
      />
    </div>
  )
}
