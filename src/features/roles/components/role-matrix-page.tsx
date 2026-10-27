import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2, Plus, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@fish-admin/react/internal/page-header'
import { Badge, Button, Checkbox, Skeleton } from '@fish-admin/react'

import {
  PERMISSION_CODES,
  type PermissionDefinition,
  type PermissionGroup,
} from '@/config/permissions'
import { usePermissionsQuery } from '@/features/permissions/queries'
import { useCan } from '@/hooks/use-can'
import { ApiError } from '@/lib/api-error'
import { useDocumentTitle } from '@/lib/document-title'
import { useAuthStore } from '@/stores/auth-store'
import type { Role } from '@/types'

import { updateRolePermissions } from '../api'
import {
  expandWildcard,
  groupState,
  isImmutableRole,
  permissionsEqual,
  toggleGroupSelection,
} from '../permissions'
import { useRolesQuery } from '../queries'
import { CreateRoleWizard } from './create-role-wizard'
import { DeleteRoleDialog } from './delete-role-dialog'
import { RenameRoleDialog } from './rename-role-dialog'
import { RoleColumnMenu } from './role-column-menu'

export function RoleMatrixPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('roles:matrix.title'))

  const queryClient = useQueryClient()
  const rolesQuery = useRolesQuery()
  const permissionsQuery = usePermissionsQuery()
  const canUpdate = useCan(PERMISSION_CODES.roleUpdate)
  const canCreate = useCan(PERMISSION_CODES.roleCreate)
  const canDelete = useCan(PERMISSION_CODES.roleDelete)
  const currentUser = useAuthStore((state) => state.user)
  const refreshUser = useAuthStore((state) => state.refreshUser)

  const [draft, setDraft] = useState<Record<string, string[]> | null>(null)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [renamingRole, setRenamingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data])
  const permissions = useMemo(() => permissionsQuery.data ?? [], [permissionsQuery.data])
  const groups = useMemo(() => {
    const map = new Map<PermissionGroup, PermissionDefinition[]>()
    for (const permission of permissions) {
      const bucket = map.get(permission.group)
      if (bucket) bucket.push(permission)
      else map.set(permission.group, [permission])
    }
    return [...map.entries()]
  }, [permissions])

  const baseline = useMemo(
    () => Object.fromEntries(roles.map((role) => [role.id, expandWildcard(role.permissions)])),
    [roles],
  )
  const effective = draft ?? baseline
  const changedRoles = useMemo(
    () =>
      roles.filter((role) => !permissionsEqual(effective[role.id] ?? [], baseline[role.id] ?? [])),
    [roles, effective, baseline],
  )

  function setRolePermissions(role: Role, next: string[]) {
    setDraft((current) => ({ ...(current ?? baseline), [role.id]: next }))
  }

  async function handleSave() {
    if (changedRoles.length === 0 || saving) return
    setSaving(true)
    const touchesCurrentRole = changedRoles.some((role) => role.id === currentUser?.roleId)

    try {
      for (const role of changedRoles) {
        if (isImmutableRole(role)) continue
        await updateRolePermissions(role.id, effective[role.id] ?? [])
      }
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDraft(null)
      if (touchesCurrentRole) await refreshUser()
      toast.success(t('roles:matrix.saved'))
    } catch (error) {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (error instanceof ApiError && error.code === 'PROTECTED_ROLE') {
        toast.error(t('roles:protected'))
      } else if (error instanceof ApiError && error.status === 403) {
        toast.error(t('errors:api.forbidden'))
      } else {
        toast.error(t('roles:matrix.saveError'))
      }
    } finally {
      setSaving(false)
    }
  }

  const loading = rolesQuery.isPending || permissionsQuery.isPending
  const hasError = rolesQuery.isError || permissionsQuery.isError

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('roles:matrix.title')}
        description={t('roles:matrix.subtitle')}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/roles">
                <ArrowLeft className="size-4" />
                {t('roles:matrix.back')}
              </Link>
            </Button>
            {canCreate ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                {t('roles:newRole')}
              </Button>
            ) : null}
          </>
        }
      />

      {!canUpdate ? (
        <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {t('roles:matrix.readOnly')}
        </p>
      ) : null}

      {loading ? (
        <Skeleton className="h-[28rem] w-full rounded-xl" />
      ) : hasError ? (
        <ErrorState
          onRetry={() => {
            void rolesQuery.refetch()
            void permissionsQuery.refetch()
          }}
        />
      ) : roles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t('roles:empty.title')}
          description={t('roles:empty.description')}
        />
      ) : (
        <div
          role="region"
          aria-label={t('roles:matrix.title')}
          tabIndex={0}
          className="max-h-[calc(100vh-17rem)] overflow-auto rounded-xl border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <table
            aria-label={t('roles:matrix.tableLabel')}
            className="w-full border-collapse text-sm"
          >
            <thead className="sticky top-0 z-20 bg-background shadow-[0_1px_0_0_var(--border)]">
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-30 min-w-64 bg-background px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  {t('roles:matrix.permission')}
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    scope="col"
                    className="min-w-40 border-l px-3 py-2 text-center align-middle"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{role.name}</span>
                      {role.isSystem ? (
                        <Badge variant="outline" className="font-normal">
                          {t('roles:system')}
                        </Badge>
                      ) : null}
                      <RoleColumnMenu
                        role={role}
                        canRename={canUpdate && !role.isSystem}
                        canDelete={canDelete && !role.isSystem}
                        onRename={setRenamingRole}
                        onDelete={setDeletingRole}
                      />
                    </div>
                    {isImmutableRole(role) ? (
                      <p className="mt-1 text-[10px] font-normal text-muted-foreground">
                        {t('roles:matrix.lockedRole')}
                      </p>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>

            {groups.map(([group, items]) => {
              const codes = items.map((item) => item.code)
              const groupLabel = t(`roles:groups.${group}`)

              return (
                <tbody key={group}>
                  <tr className="border-t bg-muted/40">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-muted/40 px-4 py-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                    >
                      {groupLabel}
                    </th>
                    {roles.map((role) => {
                      const state = groupState(effective[role.id] ?? [], codes)
                      return (
                        <td key={role.id} className="border-l px-3 py-2 text-center">
                          <Checkbox
                            checked={
                              state === 'all' ? true : state === 'some' ? 'indeterminate' : false
                            }
                            disabled={!canUpdate || isImmutableRole(role) || saving}
                            aria-label={t('roles:matrix.groupToggle', {
                              role: role.name,
                              group: groupLabel,
                            })}
                            onCheckedChange={() =>
                              setRolePermissions(
                                role,
                                toggleGroupSelection(effective[role.id] ?? [], codes),
                              )
                            }
                          />
                        </td>
                      )
                    })}
                  </tr>

                  {items.map((permission) => {
                    const label = t(permission.labelKey)
                    return (
                      <tr
                        key={permission.code}
                        className="border-t transition-colors hover:bg-muted/20"
                      >
                        <th
                          scope="row"
                          className="sticky left-0 z-10 bg-background px-4 py-2.5 text-left font-normal"
                        >
                          <span className="block text-sm">{label}</span>
                          <code className="block font-mono text-[10px] text-muted-foreground">
                            {permission.code}
                          </code>
                        </th>
                        {roles.map((role) => {
                          const selected = (effective[role.id] ?? []).includes(permission.code)
                          return (
                            <td key={role.id} className="border-l px-3 py-2.5 text-center">
                              <Checkbox
                                checked={selected}
                                disabled={!canUpdate || isImmutableRole(role) || saving}
                                aria-label={t('roles:matrix.permissionToggle', {
                                  role: role.name,
                                  permission: label,
                                })}
                                onCheckedChange={(value) =>
                                  setRolePermissions(
                                    role,
                                    value
                                      ? [
                                          ...new Set([
                                            ...(effective[role.id] ?? []),
                                            permission.code,
                                          ]),
                                        ]
                                      : (effective[role.id] ?? []).filter(
                                          (code) => code !== permission.code,
                                        ),
                                  )
                                }
                              />
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              )
            })}
          </table>
        </div>
      )}

      {changedRoles.length > 0 ? (
        <div
          role="region"
          aria-label={t('roles:matrix.changesRegion')}
          className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur"
        >
          <span className="text-sm font-medium">
            {t('roles:matrix.changes', { count: changedRoles.length })}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => setDraft(null)}>
              {t('roles:matrix.discard')}
            </Button>
            <Button size="sm" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('roles:matrix.save')}
            </Button>
          </div>
        </div>
      ) : null}

      <CreateRoleWizard open={createOpen} onOpenChange={setCreateOpen} />
      <RenameRoleDialog
        role={renamingRole}
        onOpenChange={(open) => !open && setRenamingRole(null)}
      />
      <DeleteRoleDialog
        role={deletingRole}
        onOpenChange={(open) => !open && setDeletingRole(null)}
        onDeleted={(role) =>
          setDraft((current) => {
            if (!current) return current
            const next = { ...current }
            delete next[role.id]
            return next
          })
        }
      />
    </div>
  )
}
