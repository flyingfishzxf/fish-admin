import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Archive, Settings2, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/error-state'
import { Popconfirm, DetailPage, Button, Skeleton } from '@fish-admin/react'

import { PERMISSION_CODES } from '@/config/permissions'
import { useCan } from '@/hooks/use-can'
import { useDocumentTitle } from '@/lib/document-title'
import { formatDate } from '@/lib/format'

import { archiveProject } from '../api'
import { useProjectDetailQuery } from '../queries'
import { DEFAULT_PROJECTS_SEARCH } from '../search'
import { ProjectBudgetTab } from './project-budget-tab'
import { ProjectKeyMark, ProjectPriorityBadge, ProjectStatusBadge } from './project-badges'
import { ProjectMembersDrawer } from './project-members-drawer'
import { ProjectOverviewTab } from './project-overview-tab'
import { ProjectReviewTab } from './project-review-tab'
import { ProjectSettingsDrawer } from './project-settings-drawer'
import { ProjectTasksTab } from './project-tasks-tab'

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const { t, i18n } = useTranslation(['projects', 'common'])
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const canManage = useCan(PERMISSION_CODES.projectManage)
  const [membersOpen, setMembersOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const query = useProjectDetailQuery(projectId)
  const detail = query.data

  useDocumentTitle(
    detail ? `${detail.project.name} · ${t('projects:title')}` : t('projects:detail.notFoundTitle'),
  )

  const archiveMutation = useMutation({
    mutationFn: () => archiveProject(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
      toast.success(t('projects:card.archived'))
      void navigate({ to: '/projects', search: DEFAULT_PROJECTS_SEARCH })
    },
    onError: () => toast.error(t('projects:card.archiveFailed')),
  })

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  if (query.isError || !detail) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/projects" search={DEFAULT_PROJECTS_SEARCH}>
            <ArrowLeft className="size-4" />
            {t('projects:detail.back')}
          </Link>
        </Button>
        <ErrorState
          title={t('projects:detail.notFoundTitle')}
          description={t('projects:detail.notFoundDescription')}
          onRetry={() => void query.refetch()}
        />
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/projects" search={DEFAULT_PROJECTS_SEARCH}>
              {t('projects:detail.notFoundAction')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const project = detail.project

  return (
    <>
      <DetailPage
        back={
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to="/projects" search={DEFAULT_PROJECTS_SEARCH}>
              <ArrowLeft className="size-4" />
              {t('projects:detail.back')}
            </Link>
          </Button>
        }
        avatar={<ProjectKeyMark projectKey={project.key} className="size-14 rounded-2xl text-sm" />}
        title={project.name}
        subtitle={project.description}
        badges={
          <>
            <ProjectStatusBadge
              status={project.status}
              label={t(`projects:status.${project.status}`)}
            />
            <ProjectPriorityBadge
              priority={project.priority}
              label={t(`projects:priority.${project.priority}`)}
            />
          </>
        }
        meta={
          <>
            <span>
              {t('projects:detail.owner')}: {project.ownerName}
            </span>
            <span>
              {t('projects:detail.department')}:{' '}
              {project.departmentName
                ? t(`common:departments.${project.departmentName}`, {
                    defaultValue: project.departmentName,
                  })
                : '—'}
            </span>
            <span>{t('projects:detail.memberCount', { count: project.memberIds.length })}</span>
            <span>
              {t('projects:detail.due', {
                date: formatDate(project.dueDate, i18n.language, { dateStyle: 'medium' }),
              })}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setMembersOpen(true)}>
              <Users className="size-4" />
              {t('projects:detail.members.manage')}
            </Button>
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="size-4" />
              {t('projects:detail.settings.title')}
            </Button>
            {canManage ? (
              <Popconfirm
                title={t('projects:card.archiveTitle', { project: project.name })}
                description={t('projects:card.archiveDescription')}
                confirmLabel={t('projects:card.archive')}
                onConfirm={() => archiveMutation.mutate()}
                pending={archiveMutation.isPending}
                destructive
              >
                <Button variant="destructive" disabled={archiveMutation.isPending}>
                  <Archive className="size-4" />
                  {t('projects:card.archive')}
                </Button>
              </Popconfirm>
            ) : null}
          </>
        }
        tabsLabel={t('projects:detail.tabsLabel')}
        tabs={[
          {
            value: 'overview',
            label: t('projects:detail.tabs.overview'),
            content: <ProjectOverviewTab detail={detail} canManage={canManage} />,
          },
          {
            value: 'tasks',
            label: t('projects:detail.tabs.tasks'),
            content: <ProjectTasksTab detail={detail} canManage={canManage} />,
          },
          {
            value: 'budget',
            label: t('projects:detail.tabs.budget'),
            content: <ProjectBudgetTab detail={detail} canManage={canManage} />,
          },
          {
            value: 'review',
            label: t('projects:detail.tabs.review'),
            content: <ProjectReviewTab detail={detail} canManage={canManage} />,
          },
        ]}
      />

      <ProjectMembersDrawer project={project} open={membersOpen} onOpenChange={setMembersOpen} />
      <ProjectSettingsDrawer
        project={project}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        canManage={canManage}
        onArchived={() => void navigate({ to: '/projects', search: DEFAULT_PROJECTS_SEARCH })}
      />
    </>
  )
}
