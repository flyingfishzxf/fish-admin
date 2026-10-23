import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Building2, Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/common/error-state'
import { StatusBadge } from '@/components/common/status-badge'
import { Result } from '@/components/enterprise/result/result'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERMISSION_CODES } from '@/config/permissions'
import { useRoleOptionsQuery } from '@/features/roles/queries'
import { useCan } from '@/hooks/use-can'
import { ApiError } from '@/lib/api-error'
import { useDocumentTitle } from '@/lib/document-title'
import { formatDate } from '@/lib/format'
import { getInitials } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { useUserDetailQuery } from '../queries'
import { DEFAULT_USERS_SEARCH } from '../search'
import { DeleteUserDialog } from './delete-user-dialog'
import { UserActivityTab } from './user-activity-tab'
import { UserFormDrawer } from './user-form-drawer'
import { UserOverview } from './user-overview'

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  )
}

export function UserDetailPage({ userId }: { userId: string }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const query = useUserDetailQuery(userId)
  const roleOptions = useRoleOptionsQuery()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const canEdit = useCan(PERMISSION_CODES.userUpdate)
  const canDelete = useCan(PERMISSION_CODES.userDelete)
  const canReadAudit = useCan(PERMISSION_CODES.auditRead)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useDocumentTitle(query.data?.name ?? t('users:detail.title'))

  function goBack() {
    if (window.history.length > 1) {
      router.history.back()
      return
    }
    void navigate({ to: '/users', search: DEFAULT_USERS_SEARCH })
  }

  if (query.isPending) return <UserDetailSkeleton />

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) {
      return (
        <Result
          status="not-found"
          title={t('users:detail.notFoundTitle')}
          description={t('users:detail.notFoundDescription')}
          extra={
            <Button
              variant="outline"
              onClick={() => void navigate({ to: '/users', search: DEFAULT_USERS_SEARCH })}
            >
              <ArrowLeft className="size-4" />
              {t('users:detail.back')}
            </Button>
          }
        />
      )
    }

    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const user = query.data
  const department = t(`common:departments.${user.department}`, {
    defaultValue: user.department,
  })

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={goBack}>
        <ArrowLeft className="size-4" />
        {t('users:detail.back')}
      </Button>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-16">
            {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
            <AvatarFallback className="bg-brand-soft text-lg font-semibold text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
              <StatusBadge status={user.status} />
            </div>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                {user.roleName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                {department}
              </span>
              <span>
                {t('users:detail.joined')}:{' '}
                {formatDate(user.createdAt, i18n.language, { dateStyle: 'medium' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canEdit ? (
            <Button onClick={() => setFormOpen(true)}>
              <Pencil className="size-4" />
              {t('users:actions.edit')}
            </Button>
          ) : null}
          {canDelete && user.id !== currentUserId ? (
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              {t('users:actions.delete')}
            </Button>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList>
          <TabsTrigger value="overview">{t('users:detail.tabs.overview')}</TabsTrigger>
          {canReadAudit ? (
            <TabsTrigger value="activity">{t('users:detail.tabs.activity')}</TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="overview">
          <UserOverview user={user} canEdit={canEdit} />
        </TabsContent>
        {canReadAudit ? (
          <TabsContent value="activity">
            <UserActivityTab userId={user.id} />
          </TabsContent>
        ) : null}
      </Tabs>

      {canEdit ? (
        <UserFormDrawer
          open={formOpen}
          onOpenChange={setFormOpen}
          user={user}
          roles={roleOptions.data ?? []}
          rolesLoading={roleOptions.isPending}
        />
      ) : null}

      <DeleteUserDialog
        user={deleteOpen ? user : null}
        onOpenChange={(open) => !open && setDeleteOpen(false)}
        onDeleted={() => void navigate({ to: '/users', search: DEFAULT_USERS_SEARCH })}
      />
    </div>
  )
}
