import { Fragment, useMemo, useState } from 'react'
import { KeyRound, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PERMISSION_GROUPS, type PermissionGroup } from '@/config/permissions'
import { useDocumentTitle } from '@/lib/document-title'

import { usePermissionsQuery } from '../queries'

export function PermissionsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('permissions:title'))
  const query = usePermissionsQuery()
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState<PermissionGroup | 'all'>('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (query.data ?? []).filter((permission) => {
      if (group !== 'all' && permission.group !== group) return false
      if (!term) return true
      const label = t(permission.labelKey).toLowerCase()
      return (
        permission.code.toLowerCase().includes(term) ||
        label.includes(term) ||
        permission.group.includes(term)
      )
    })
  }, [query.data, search, group, t])

  const grouped = useMemo(
    () =>
      PERMISSION_GROUPS.map((groupId) => ({
        id: groupId,
        items: filtered.filter((permission) => permission.group === groupId),
      })).filter((entry) => entry.items.length > 0),
    [filtered],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('permissions:title')}
        description={t('permissions:subtitle')}
        actions={
          <Badge variant="secondary" className="font-normal">
            {t('permissions:count', { count: query.data?.length ?? 0 })}
          </Badge>
        }
      />

      <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        {t('permissions:readOnlyNote')}
      </p>

      <div className="shadow-soft overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('permissions:searchPlaceholder')}
              aria-label={t('common:actions.search')}
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={group}
            onValueChange={(value) => setGroup(value as PermissionGroup | 'all')}
          >
            <SelectTrigger
              className="h-9 w-full sm:w-44"
              aria-label={t('permissions:columns.group')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('permissions:allGroups')}</SelectItem>
              {PERMISSION_GROUPS.map((groupId) => (
                <SelectItem key={groupId} value={groupId}>
                  {t(`permissions:groups.${groupId}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {query.isPending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState className="border-0" onRetry={() => void query.refetch()} />
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title={t('permissions:empty.title')}
            description={t('permissions:empty.description')}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 bg-muted/35 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {t('permissions:columns.label')}
                  </TableHead>
                  <TableHead className="h-10 w-52 bg-muted/35 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {t('permissions:columns.code')}
                  </TableHead>
                  <TableHead className="hidden h-10 bg-muted/35 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase md:table-cell">
                    {t('permissions:columns.description')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((entry) => (
                  <Fragment key={entry.id}>
                    <TableRow className="bg-muted/25 hover:bg-muted/25">
                      <TableCell colSpan={3} className="py-2.5">
                        <span className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                          {t(`permissions:groups.${entry.id}`)}
                          <Badge variant="outline" className="font-normal">
                            {entry.items.length}
                          </Badge>
                        </span>
                      </TableCell>
                    </TableRow>
                    {entry.items.map((permission) => (
                      <TableRow key={permission.code}>
                        <TableCell className="py-3">
                          <p className="text-sm font-medium">{t(permission.labelKey)}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {t(permission.descriptionKey)}
                          </p>
                        </TableCell>
                        <TableCell className="py-3">
                          <code className="rounded-md bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                            {permission.code}
                          </code>
                        </TableCell>
                        <TableCell className="hidden py-3 text-sm text-muted-foreground md:table-cell">
                          {t(permission.descriptionKey)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
