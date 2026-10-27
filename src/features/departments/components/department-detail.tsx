import { Building2, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/common/error-state'
import { StatusBadge } from '@/components/common/status-badge'
import { DataTablePagination } from '@fish-admin/react/internal/data-table'
import {
  Descriptions,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fish-admin/react'

import { formatDate } from '@/lib/format'
import { treePath } from '@fish-admin/react/internal/tree'
import type { Department } from '@/types'

import { useUserListQuery } from '@/features/users/queries'

export function DepartmentDetail({
  department,
  departments,
  canManage,
  onNewChild,
  onRename,
}: {
  department: Department
  departments: Department[]
  canManage: boolean
  onNewChild: () => void
  onRename: () => void
}) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const members = useUserListQuery({
    page,
    pageSize,
    departmentId: department.id,
    includeDescendants: true,
  })

  const label = (name: string) => t(`common:departments.${name}`, { defaultValue: name })
  const path = treePath(departments, department.id).map((item) => label(item.name))
  const parent = departments.find((item) => item.id === department.parentId)

  return (
    <Card className="shadow-soft">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="bg-brand-soft flex size-10 shrink-0 items-center justify-center rounded-xl text-primary">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-lg">{label(department.name)}</CardTitle>
              <CardDescription className="break-words">
                {path.length > 1 ? path.join(' / ') : t('departments:root')}
              </CardDescription>
            </div>
          </div>
          {canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={onNewChild}>
                <Plus className="size-4" />
                {t('departments:newChild')}
              </Button>
              <Button variant="outline" size="sm" onClick={onRename}>
                <Pencil className="size-4" />
                {t('departments:rename')}
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Descriptions
          columns={3}
          items={[
            {
              term: t('departments:parent'),
              description: parent ? label(parent.name) : t('departments:root'),
            },
            {
              term: t('departments:manager'),
              description: department.managerName ?? (
                <span className="text-muted-foreground">{t('departments:unassigned')}</span>
              ),
            },
            {
              term: t('departments:createdAt'),
              description: formatDate(department.createdAt, i18n.language, {
                dateStyle: 'medium',
              }),
            },
            {
              term: t('departments:directMembers'),
              description: department.directMemberCount,
            },
            {
              term: t('departments:totalMembers'),
              description: department.memberCount,
            },
          ]}
        />

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{t('departments:members')}</h3>
            <Badge variant="secondary" className="font-normal">
              {t('departments:memberCount', { count: members.data?.total ?? 0 })}
            </Badge>
          </div>

          {members.isError ? (
            <ErrorState title={t('departments:loadError')} onRetry={() => void members.refetch()} />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] font-semibold tracking-wide uppercase">
                        {t('departments:memberColumns.name')}
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold tracking-wide uppercase">
                        {t('departments:memberColumns.role')}
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold tracking-wide uppercase">
                        {t('departments:memberColumns.status')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.isPending ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index} className="hover:bg-transparent">
                          {Array.from({ length: 3 }).map((__, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : members.data && members.data.items.length > 0 ? (
                      members.data.items.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">
                              {user.roleName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={user.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          {t('departments:noMembers')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {members.data && members.data.total > 0 ? (
                <DataTablePagination
                  page={members.data.page}
                  pageCount={members.data.pageCount}
                  total={members.data.total}
                  pageSize={members.data.pageSize}
                  pageSizeOptions={[5, 10, 20]}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(1)
                  }}
                />
              ) : null}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
