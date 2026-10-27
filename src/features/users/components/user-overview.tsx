import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/status-badge'
import {
  Descriptions,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@fish-admin/react'

import { formatDate, formatRelativeTime } from '@/lib/format'
import type { User } from '@/types'

import { AvatarDropzone } from './avatar-dropzone'
import { TagsEditor } from './tags-editor'

function YesNo({ value }: { value: boolean }) {
  const { t } = useTranslation()
  return (
    <span className={value ? undefined : 'text-muted-foreground'}>
      {t(value ? 'users:detail.enabled' : 'users:detail.disabled')}
    </span>
  )
}

export function UserOverview({ user, canEdit }: { user: User; canEdit: boolean }) {
  const { t, i18n } = useTranslation()

  const departmentLabel =
    user.departmentPath && user.departmentPath.length > 0
      ? user.departmentPath
          .map((name) => t(`common:departments.${name}`, { defaultValue: name }))
          .join(' / ')
      : t(`common:departments.${user.department}`, { defaultValue: user.department })

  return (
    <Card className="shadow-soft">
      <CardHeader className="gap-1">
        <CardTitle className="text-base">{t('users:detail.profile')}</CardTitle>
        <CardDescription>{t('users:detail.profileDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Descriptions
          columns={3}
          items={[
            {
              term: t('users:detail.role'),
              description: (
                <Badge variant="secondary" className="font-normal">
                  {user.roleName}
                </Badge>
              ),
            },
            {
              term: t('users:detail.department'),
              description: departmentLabel,
            },
            {
              term: t('users:detail.jobTitle'),
              description: user.jobTitle ? (
                user.jobTitle
              ) : (
                <span className="text-muted-foreground">{t('users:detail.noJobTitle')}</span>
              ),
            },
            {
              term: t('users:detail.status'),
              description: <StatusBadge status={user.status} />,
            },
            {
              term: t('users:detail.emailVerified'),
              description: <YesNo value={user.emailVerified} />,
            },
            {
              term: t('users:detail.twoFactor'),
              description: <YesNo value={user.twoFactorEnabled} />,
            },
            {
              term: t('users:detail.joined'),
              description: formatDate(user.createdAt, i18n.language, { dateStyle: 'medium' }),
            },
            {
              term: t('users:detail.lastActive'),
              description: formatRelativeTime(user.lastActiveAt, i18n.language),
            },
            {
              term: t('users:detail.bio'),
              description: user.bio ? (
                user.bio
              ) : (
                <span className="text-muted-foreground">{t('users:detail.noBio')}</span>
              ),
            },
          ]}
        />

        <Separator />

        <div className="grid gap-6 lg:grid-cols-2">
          <TagsEditor user={user} canEdit={canEdit} />
          <AvatarDropzone user={user} canEdit={canEdit} />
        </div>
      </CardContent>
    </Card>
  )
}
