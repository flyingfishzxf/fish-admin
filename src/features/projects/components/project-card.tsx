import { Link } from '@tanstack/react-router'
import { Archive, ArrowUpRight, CalendarClock, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Popconfirm,
  Button,
  Card,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Progress,
} from '@fish-admin/react'

import { formatCurrency, formatDate } from '@/lib/format'
import type { Project } from '@/types'

import { ProjectKeyMark, ProjectPriorityBadge, ProjectStatusBadge } from './project-badges'

export function ProjectCard({
  project,
  language,
  canManage,
  archiving,
  onArchive,
}: {
  project: Project
  language: string
  canManage: boolean
  archiving: boolean
  onArchive: (project: Project) => void
}) {
  const { t } = useTranslation('projects')
  const totalTasks = Object.values(project.taskCounts).reduce((total, count) => total + count, 0)
  const doneTasks = project.taskCounts.done
  const spentPercent = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          data-slot="project-card"
          className="shadow-soft flex h-full flex-col gap-4 p-5 transition-colors hover:border-primary/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <ProjectKeyMark projectKey={project.key} />
              <div className="min-w-0 space-y-1">
                <Link
                  to="/projects/$id"
                  params={{ id: project.id }}
                  className="block truncate font-semibold hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {project.name}
                </Link>
                <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
              </div>
            </div>
            {canManage ? (
              <Popconfirm
                title={t('card.archiveTitle', { project: project.name })}
                description={t('card.archiveDescription')}
                confirmLabel={t('card.archive')}
                onConfirm={() => onArchive(project)}
                pending={archiving}
                destructive
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('card.archive')}
                  disabled={archiving}
                >
                  <Archive className="size-4" />
                </Button>
              </Popconfirm>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={project.status} label={t(`status.${project.status}`)} />
            <ProjectPriorityBadge
              priority={project.priority}
              label={t(`priority.${project.priority}`)}
            />
            {project.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('card.tasks', { done: doneTasks, total: totalTasks })}</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} aria-label={t('detail.overview.progress')} />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t('card.budget', {
                spent: formatCurrency(project.spent, language),
                budget: formatCurrency(project.budget, language),
              })}
            </span>
            <span>{spentPercent}%</span>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
            <div className="flex min-w-0 items-center gap-3">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    className="truncate rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {project.ownerName}
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-64">
                  <div className="space-y-1">
                    <p className="font-medium">{project.ownerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('detail.owner')}
                      {project.departmentName ? ` · ${project.departmentName}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('card.members', { count: project.memberIds.length })}
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" aria-hidden />
                {project.memberIds.length}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" aria-hidden />
                {formatDate(project.dueDate, language, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <Button asChild variant="ghost" size="icon-sm">
              <Link to="/projects/$id" params={{ id: project.id }} aria-label={t('card.open')}>
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem asChild>
          <Link to="/projects/$id" params={{ id: project.id }}>
            {t('card.open')}
          </Link>
        </ContextMenuItem>
        {canManage ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              disabled={archiving}
              onSelect={() => onArchive(project)}
            >
              {t('card.archive')}
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  )
}
