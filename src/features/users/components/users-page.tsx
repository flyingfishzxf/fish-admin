import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCoreRowModel,
  useReactTable,
  type ColumnOrderState,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  AlignJustify,
  BadgeCheck,
  ChevronDown,
  Download,
  List,
  Loader2,
  Plus,
  SearchX,
  Trash2,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can } from '@/components/common/can'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import type { DataTableDensity } from '@/components/data-table/data-table'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { ProTable } from '@/components/pro/pro-table/pro-table'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PERMISSION_CODES } from '@/config/permissions'
import { useCan } from '@/hooks/use-can'
import { downloadCsv, toCsv } from '@/lib/csv'
import { useDocumentTitle } from '@/lib/document-title'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import type { User, UserStatus } from '@/types'

import { bulkDeleteUsers, bulkUpdateUserStatus, fetchUsers, restoreUsers } from '../api'
import { useUserListQuery } from '../queries'
import { USER_STATUSES } from '../schemas'
import type { UserSortKey, UsersSearch } from '../search'
import { useRoleOptionsQuery } from '@/features/roles/queries'
import { DeleteUserDialog } from './delete-user-dialog'
import { SavedViewsMenu, type SavedView } from './saved-views-menu'
import { createUserColumns } from './user-columns'
import { UserContextMenu } from './user-context-menu'
import { UserFormDrawer } from './user-form-drawer'

const DENSITY_KEY = 'fish-admin:users-density'

function readDensity(): DataTableDensity {
  return localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable'
}

export function UsersPage({
  search,
  onSearchChange,
}: {
  search: UsersSearch
  onSearchChange: (updater: (previous: UsersSearch) => UsersSearch) => void
}) {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('users:title'))
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const canEdit = useCan(PERMISSION_CODES.userUpdate)
  const canDelete = useCan(PERMISSION_CODES.userDelete)
  const selectable = canEdit || canDelete

  const [searchValue, setSearchValue] = useState(search.q ?? '')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    department: false,
  })
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [density, setDensity] = useState<DataTableDensity>(readDensity)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const query = useUserListQuery({
    page: search.page,
    pageSize: search.pageSize,
    q: search.q,
    roleId: search.roleId,
    status: search.status,
    sort: search.sort,
    order: search.order,
  })
  const roleOptions = useRoleOptionsQuery()

  const statusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: UserStatus }) =>
      bulkUpdateUserStatus(ids, status),
    onSuccess: (result) => {
      setRowSelection({})
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (result.updated.length === 0) {
        toast.info(t('users:bulk.noChanges'))
      } else {
        toast.success(t('users:bulk.statusSuccess', { count: result.updated.length }))
      }
    },
    onError: () => toast.error(t('users:bulk.statusError')),
  })

  const restoreMutation = useMutation({
    mutationFn: restoreUsers,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (result.restored.length > 0) {
        toast.success(t('users:bulk.restoreSuccess', { count: result.restored.length }))
      }
    },
    onError: () => toast.error(t('users:bulk.restoreError')),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteUsers,
    onSuccess: (result) => {
      setBulkDeleteOpen(false)
      setRowSelection({})
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (result.deleted.length === 0) {
        toast.info(t('users:bulk.noChanges'))
        return
      }
      toast.success(t('users:bulk.deleteSuccess', { count: result.deleted.length }), {
        duration: 8000,
        action: {
          label: t('users:bulk.undo'),
          onClick: () => restoreMutation.mutate(result.deleted),
        },
      })
    },
    onError: () => toast.error(t('users:bulk.deleteError')),
  })

  const rows = useMemo(() => query.data?.items ?? [], [query.data])
  const total = query.data?.total ?? 0
  const pageCount = query.data?.pageCount ?? 1
  const hasFilters = Boolean(search.q || search.roleId || search.status)
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  )
  const selectedCount = selectedIds.length

  useEffect(() => {
    setSearchValue(search.q ?? '')
  }, [search.q])

  useEffect(() => {
    const trimmed = searchValue.trim()
    if (trimmed === (search.q ?? '')) return
    const timer = window.setTimeout(() => {
      onSearchChange((previous) => ({
        ...previous,
        q: trimmed || undefined,
        page: 1,
      }))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchValue, search.q, onSearchChange])

  useEffect(() => {
    const serverPage = query.data?.page
    if (!query.isPlaceholderData && serverPage && serverPage !== search.page) {
      onSearchChange((previous) => ({ ...previous, page: serverPage }))
    }
  }, [query.data?.page, query.isPlaceholderData, search.page, onSearchChange])

  useEffect(() => {
    setRowSelection({})
  }, [
    search.page,
    search.pageSize,
    search.q,
    search.roleId,
    search.status,
    search.sort,
    search.order,
  ])

  const handleSort = useCallback(
    (key: UserSortKey) => {
      onSearchChange((previous) => {
        if (previous.sort === key) {
          return {
            ...previous,
            order: previous.order === 'asc' ? 'desc' : 'asc',
            page: 1,
          }
        }
        return {
          ...previous,
          sort: key,
          order: key === 'createdAt' || key === 'lastActiveAt' ? 'desc' : 'asc',
          page: 1,
        }
      })
    },
    [onSearchChange],
  )

  const openCreate = useCallback(() => {
    setEditingUser(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((user: User) => {
    setEditingUser(user)
    setFormOpen(true)
  }, [])

  const clearFilters = useCallback(() => {
    setSearchValue('')
    onSearchChange((previous) => ({
      ...previous,
      q: undefined,
      roleId: undefined,
      status: undefined,
      page: 1,
    }))
  }, [onSearchChange])

  const applyView = useCallback(
    (view: SavedView) => {
      setSearchValue(view.search.q ?? '')
      onSearchChange((previous) => ({
        ...previous,
        ...view.search,
        page: 1,
      }))
    },
    [onSearchChange],
  )

  const updateDensity = useCallback((value: string) => {
    if (value !== 'comfortable' && value !== 'compact') return
    setDensity(value)
    localStorage.setItem(DENSITY_KEY, value)
  }, [])

  function handleStatusChange(user: User, status: UserStatus) {
    statusMutation.mutate({ ids: [user.id], status })
  }

  const columns = useMemo(
    () =>
      createUserColumns({
        t,
        language: i18n.language,
        currentUserId: currentUser?.id,
        canEdit,
        canDelete,
        selectable,
        sort: search.sort,
        order: search.order,
        onSort: handleSort,
        onEdit: openEdit,
        onDelete: setDeletingUser,
      }),
    [
      t,
      i18n.language,
      currentUser?.id,
      canEdit,
      canDelete,
      selectable,
      search.sort,
      search.order,
      handleSort,
      openEdit,
    ],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { columnVisibility, columnOrder, rowSelection },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: selectable,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    defaultColumn: { minSize: 80, maxSize: 600 },
    initialState: { columnPinning: { left: selectable ? ['select', 'name'] : ['name'] } },
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    manualSorting: true,
    pageCount,
  })

  async function handleExport() {
    setExporting(true)
    try {
      const collected: User[] = []
      let page = 1
      let totalPages = 1

      do {
        const result = await fetchUsers({
          page,
          pageSize: 100,
          q: search.q,
          roleId: search.roleId,
          status: search.status,
          sort: search.sort,
          order: search.order,
        })
        collected.push(...result.items)
        totalPages = result.pageCount
        page += 1
      } while (page <= totalPages)

      const csv = toCsv(
        collected.map((user) => ({
          name: user.name,
          email: user.email,
          role: user.roleName,
          status: t(`common:status.${user.status}`),
          department: t(`common:departments.${user.department}`, {
            defaultValue: user.department,
          }),
          createdAt: formatDate(user.createdAt, i18n.language, {
            dateStyle: 'medium',
          }),
        })),
        [
          { key: 'name', label: t('users:columns.name') },
          { key: 'email', label: t('users:columns.email') },
          { key: 'role', label: t('users:columns.role') },
          { key: 'status', label: t('users:columns.status') },
          { key: 'department', label: t('users:columns.department') },
          { key: 'createdAt', label: t('users:columns.createdAt') },
        ],
      )

      downloadCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`, csv)
      toast.success(t('users:exportSuccess'))
    } catch {
      toast.error(t('errors:api.unknown'))
    } finally {
      setExporting(false)
    }
  }

  const emptyState = hasFilters ? (
    <EmptyState
      icon={SearchX}
      title={t('users:noResults.title')}
      description={t('users:noResults.description')}
      action={
        <Button variant="outline" size="sm" onClick={clearFilters}>
          {t('users:noResults.action')}
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={Users}
      title={t('users:empty.title')}
      description={t('users:empty.description')}
      action={
        <Can permission={PERMISSION_CODES.userCreate}>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            {t('users:empty.action')}
          </Button>
        </Can>
      }
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('users:title')}
        description={t('users:subtitle')}
        actions={
          <Can permission={PERMISSION_CODES.userCreate}>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t('users:addUser')}
            </Button>
          </Can>
        }
      />

      {query.isError && !query.data ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : (
        <ProTable
          table={table}
          loading={query.isPending}
          fetching={query.isFetching && !query.isPending}
          fetchingLabel={t('common:states.loading')}
          density={density}
          empty={emptyState}
          search={{
            value: searchValue,
            onChange: setSearchValue,
            placeholder: t('users:searchPlaceholder'),
            ariaLabel: t('common:actions.search'),
            clearLabel: t('common:actions.clearSearch'),
          }}
          filters={
            <>
              <Select
                value={search.roleId ?? 'all'}
                onValueChange={(value) =>
                  onSearchChange((previous) => ({
                    ...previous,
                    roleId: value === 'all' ? undefined : value,
                    page: 1,
                  }))
                }
                disabled={roleOptions.isPending}
              >
                <SelectTrigger className="h-9 w-[9.5rem]" aria-label={t('users:filters.role')}>
                  <SelectValue placeholder={t('users:filters.allRoles')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('users:filters.allRoles')}</SelectItem>
                  {(roleOptions.data ?? []).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={search.status ?? 'all'}
                onValueChange={(value) =>
                  onSearchChange((previous) => ({
                    ...previous,
                    status: value === 'all' ? undefined : (value as UserStatus),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="h-9 w-[8.5rem]" aria-label={t('users:filters.status')}>
                  <SelectValue placeholder={t('users:filters.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('users:filters.allStatuses')}</SelectItem>
                  {USER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`common:status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasFilters ? (
                <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
                  {t('users:actions.resetFilters')}
                </Button>
              ) : null}
            </>
          }
          actions={
            <>
              <SavedViewsMenu
                key={currentUser?.id ?? 'anonymous'}
                userId={currentUser?.id ?? 'anonymous'}
                search={search}
                onApply={applyView}
              />
              <ToggleGroup
                type="single"
                value={density}
                onValueChange={updateDensity}
                variant="outline"
                size="sm"
                aria-label={t('users:density.label')}
              >
                <ToggleGroupItem value="comfortable" aria-label={t('users:density.comfortable')}>
                  <List className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="compact" aria-label={t('users:density.compact')}>
                  <AlignJustify className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                disabled={exporting || total === 0}
                onClick={() => void handleExport()}
              >
                {exporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                <span className="hidden sm:inline">{t('users:actions.exportCsv')}</span>
              </Button>
              <DataTableViewOptions table={table} />
            </>
          }
          pagination={{
            page: query.data?.page ?? search.page,
            pageCount: Math.max(pageCount, 1),
            total,
            pageSize: search.pageSize,
            onPageChange: (page) => onSearchChange((previous) => ({ ...previous, page })),
            onPageSizeChange: (pageSize) =>
              onSearchChange((previous) => ({ ...previous, pageSize, page: 1 })),
          }}
          selection={
            selectedCount > 0
              ? {
                  count: selectedCount,
                  label: t('users:bulk.selected', { count: selectedCount }),
                  regionLabel: t('users:bulk.regionLabel'),
                  clearLabel: t('users:bulk.clear'),
                  onClear: () => setRowSelection({}),
                  children: (
                    <>
                      {canEdit ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={statusMutation.isPending}>
                              {statusMutation.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <BadgeCheck className="size-4" />
                              )}
                              {t('users:bulk.setStatus')}
                              <ChevronDown className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="top" align="center" className="w-44">
                            <DropdownMenuLabel>{t('users:bulk.setStatus')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {USER_STATUSES.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onSelect={() => statusMutation.mutate({ ids: selectedIds, status })}
                              >
                                {t(`common:status.${status}`)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                      {canDelete ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setBulkDeleteOpen(true)}
                        >
                          <Trash2 className="size-4" />
                          {t('users:bulk.delete')}
                        </Button>
                      ) : null}
                    </>
                  ),
                }
              : undefined
          }
          rowContextMenu={(user) => (
            <UserContextMenu
              user={user}
              currentUserId={currentUser?.id}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={openEdit}
              onDelete={setDeletingUser}
              onStatusChange={handleStatusChange}
            />
          )}
        />
      )}

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('users:bulk.deleteTitle', { count: selectedCount })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('users:bulk.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>
              {t('common:actions.cancel')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={bulkDeleteMutation.isPending || selectedCount === 0}
              onClick={() => bulkDeleteMutation.mutate(selectedIds)}
            >
              {bulkDeleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('users:bulk.deleteConfirm', { count: selectedCount })}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        roles={roleOptions.data ?? []}
        rolesLoading={roleOptions.isPending}
      />
      <DeleteUserDialog
        user={deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      />
    </div>
  )
}
