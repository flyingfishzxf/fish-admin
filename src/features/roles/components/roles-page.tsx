import { Link } from '@tanstack/react-router'
import {
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Table2,
  Trash2,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PERMISSION_CODES } from '@/config/permissions'
import { useCan } from '@/hooks/use-can'
import { useDocumentTitle } from '@/lib/document-title'
import type { Role } from '@/types'

import { isImmutableRole } from '../permissions'
import { useRolesQuery } from '../queries'
import { CreateRoleWizard } from './create-role-wizard'
import { DeleteRoleDialog } from './delete-role-dialog'
import { RenameRoleDialog } from './rename-role-dialog'
import { RolePermissionDialog } from './role-permission-dialog'

export function RolesPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('roles:title'))
  const query = useRolesQuery()
  const canUpdate = useCan(PERMISSION_CODES.roleUpdate)
  const canCreate = useCan(PERMISSION_CODES.roleCreate)
  const canDelete = useCan(PERMISSION_CODES.roleDelete)
  const [search, setSearch] = useState('')
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [renamingRole, setRenamingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)

  const roles = useMemo(() => {
    const term = search.trim().toLowerCase()
    const items = query.data ?? []
    if (!term) return items
    return items.filter(
      (role) =>
        role.name.toLowerCase().includes(term) || role.description.toLowerCase().includes(term),
    )
  }, [query.data, search])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('roles:title')}
        description={t('roles:subtitle')}
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('roles:searchPlaceholder')}
                aria-label={t('common:actions.search')}
                className="h-9 pl-9"
              />
            </div>
            <Button variant="outline" asChild>
              <Link to="/roles/matrix">
                <Table2 className="size-4" />
                {t('roles:permissionMatrix')}
              </Link>
            </Button>
            {canCreate ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                {t('roles:newRole')}
              </Button>
            ) : null}
          </div>
        }
      />

      {!canUpdate ? (
        <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {t('roles:readOnly')}
        </p>
      ) : null}

      {query.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="shadow-soft">
              <CardHeader>
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : roles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t('roles:empty.title')}
          description={t('roles:empty.description')}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            const immutable = isImmutableRole(role)
            const canRename = canUpdate && !role.isSystem
            const canRemove = canDelete && !role.isSystem

            return (
              <Card key={role.id} className="shadow-soft flex flex-col">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="bg-brand-soft flex size-10 items-center justify-center rounded-xl text-primary">
                      <ShieldCheck className="size-5" />
                    </div>
                    {role.isSystem ? (
                      <Badge variant="outline" className="font-normal">
                        {t('roles:system')}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription>
                      {t(`roles:descriptions.${role.id}`, {
                        defaultValue: role.description,
                      })}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {t('roles:usersCount', { count: role.userCount })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="size-3.5" />
                      {role.permissions.includes('*')
                        ? t('roles:wildcard')
                        : t('roles:permissionsCount', { count: role.permissions.length })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingRole(role)}
                    >
                      {canUpdate && !immutable ? (
                        <Pencil className="size-4" />
                      ) : (
                        <KeyRound className="size-4" />
                      )}
                      {canUpdate && !immutable
                        ? t('roles:editPermissions')
                        : t('roles:viewPermissions')}
                    </Button>
                    {canRename || canRemove ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={t('roles:cardActions', { role: role.name })}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {canRename ? (
                            <DropdownMenuItem onSelect={() => setRenamingRole(role)}>
                              <Pencil />
                              {t('roles:rename.action')}
                            </DropdownMenuItem>
                          ) : null}
                          {canRename && canRemove ? <DropdownMenuSeparator /> : null}
                          {canRemove ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeletingRole(role)}
                            >
                              <Trash2 />
                              {t('roles:deleteRole.action')}
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <RolePermissionDialog
        role={editingRole}
        canEdit={canUpdate}
        onOpenChange={(open) => !open && setEditingRole(null)}
      />
      <CreateRoleWizard open={createOpen} onOpenChange={setCreateOpen} />
      <RenameRoleDialog
        role={renamingRole}
        onOpenChange={(open) => !open && setRenamingRole(null)}
      />
      <DeleteRoleDialog
        role={deletingRole}
        onOpenChange={(open) => !open && setDeletingRole(null)}
      />
    </div>
  )
}
