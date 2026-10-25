import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Descriptions } from '@/components/enterprise/descriptions/descriptions'
import { ImagePreview } from '@/components/enterprise/image-preview/image-preview'
import { Popconfirm } from '@/components/enterprise/popconfirm/popconfirm'
import { Timeline, type TimelineItem } from '@/components/enterprise/timeline/timeline'
import { Upload, type UploadItem } from '@/components/enterprise/upload/upload'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { AUDIT_ACTION_ICONS, AUDIT_ACTION_TONES } from '@/config/audit'
import { useAuditListQuery } from '@/features/audit/queries'
import { formatDate, formatDateTime } from '@/lib/format'
import type { ProjectDetail, ProjectMilestone } from '@/types'

import { removeProjectAttachment, toggleMilestone, uploadProjectAttachment } from '../api'
import { ProjectPriorityBadge, ProjectStatusBadge } from './project-badges'

const MAX_INLINE_BYTES = 256_000

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('read-failed'))
    reader.readAsDataURL(file)
  })
}

function dayKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** exponent).toFixed(1)} ${units[exponent]}`
}

export function ProjectOverviewTab({
  detail,
  canManage,
}: {
  detail: ProjectDetail
  canManage: boolean
}) {
  const { t, i18n } = useTranslation(['projects', 'common', 'audit'])
  const queryClient = useQueryClient()
  const project = detail.project
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [showCompleted, setShowCompleted] = useState(false)

  const activity = useAuditListQuery({
    page: 1,
    pageSize: 8,
    entityId: project.id,
  })

  const milestoneMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleMilestone(project.id, id, completed),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['projects'] }),
    onError: () => toast.error(t('common:states.error.title')),
  })

  const detachMutation = useMutation({
    mutationFn: (fileId: string) => removeProjectAttachment(project.id, fileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
      toast.success(t('projects:detail.overview.detached'))
    },
    onError: () => toast.error(t('projects:detail.overview.detachFailed')),
  })

  const completedDates = useMemo(
    () =>
      detail.milestones
        .filter((milestone) => milestone.completed)
        .map((milestone) => new Date(milestone.date)),
    [detail.milestones],
  )
  const pendingDates = useMemo(
    () =>
      detail.milestones
        .filter((milestone) => !milestone.completed)
        .map((milestone) => new Date(milestone.date)),
    [detail.milestones],
  )
  const milestonesByDay = useMemo(() => {
    const map = new Map<string, ProjectMilestone[]>()
    for (const milestone of detail.milestones) {
      const key = dayKey(milestone.date)
      const list = map.get(key) ?? []
      list.push(milestone)
      map.set(key, list)
    }
    return map
  }, [detail.milestones])

  const pendingMilestones = detail.milestones.filter((milestone) => !milestone.completed)
  const completedMilestones = detail.milestones.filter((milestone) => milestone.completed)

  const images = detail.attachments
    .filter((file) => file.mime.startsWith('image/') && file.dataUrl)
    .map((file) => ({ src: file.dataUrl as string, alt: file.name, caption: file.name }))

  async function handleFiles(files: File[]) {
    const entries = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      item: {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        status: 'uploading' as const,
        progress: 40,
      },
    }))
    setUploads((current) => [...current, ...entries.map((entry) => entry.item)])

    for (const entry of entries) {
      try {
        const dataUrl =
          entry.file.size <= MAX_INLINE_BYTES ? await readAsDataUrl(entry.file) : undefined
        await uploadProjectAttachment(project.id, {
          name: entry.file.name,
          mime: entry.file.type || 'application/octet-stream',
          size: entry.file.size,
          dataUrl,
        })
        setUploads((current) => current.filter((item) => item.id !== entry.item.id))
        void queryClient.invalidateQueries({ queryKey: ['projects'] })
        void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
        toast.success(t('projects:detail.overview.uploaded'))
      } catch {
        setUploads((current) =>
          current.map((item) =>
            item.id === entry.item.id
              ? { ...item, status: 'error', error: t('projects:detail.overview.uploadFailed') }
              : item,
          ),
        )
        toast.error(t('projects:detail.overview.uploadFailed'))
      }
    }
  }

  function toggleDay(date: Date) {
    if (!canManage) return
    const milestones = milestonesByDay.get(dayKey(date))
    if (!milestones || milestones.length === 0) return
    const nextCompleted = milestones.every((milestone) => !milestone.completed)
    for (const milestone of milestones) {
      milestoneMutation.mutate({ id: milestone.id, completed: nextCompleted })
    }
  }

  const timelineItems: TimelineItem[] =
    activity.data?.items.map((event) => {
      const tone = AUDIT_ACTION_TONES[event.action]
      return {
        id: event.id,
        title: t(`audit:actions.${event.action}`),
        description: [event.actorName, event.entityLabel].filter(Boolean).join(' · '),
        timestamp: formatDateTime(event.createdAt, i18n.language),
        icon: AUDIT_ACTION_ICONS[event.action],
        tone: tone === 'neutral' ? 'default' : tone,
      }
    }) ?? []

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">{t('projects:detail.overview.details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Descriptions
              columns={2}
              items={[
                {
                  term: t('projects:detail.overview.status'),
                  description: (
                    <ProjectStatusBadge
                      status={project.status}
                      label={t(`projects:status.${project.status}`)}
                    />
                  ),
                },
                {
                  term: t('projects:detail.overview.priority'),
                  description: (
                    <ProjectPriorityBadge
                      priority={project.priority}
                      label={t(`projects:priority.${project.priority}`)}
                    />
                  ),
                },
                {
                  term: t('projects:detail.overview.owner'),
                  description: project.ownerName,
                },
                {
                  term: t('projects:detail.overview.department'),
                  description: project.departmentName
                    ? t(`common:departments.${project.departmentName}`, {
                        defaultValue: project.departmentName,
                      })
                    : '—',
                },
                {
                  term: t('projects:detail.overview.startDate'),
                  description: formatDate(project.startDate, i18n.language, {
                    dateStyle: 'medium',
                  }),
                },
                {
                  term: t('projects:detail.overview.dueDate'),
                  description: formatDate(project.dueDate, i18n.language, { dateStyle: 'medium' }),
                },
                {
                  term: t('projects:detail.overview.tags'),
                  description:
                    project.tags.length > 0 ? (
                      <span className="flex flex-wrap gap-1.5">
                        {project.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      t('projects:detail.overview.noTags')
                    ),
                  span: 2,
                },
                {
                  term: t('projects:detail.overview.description'),
                  description: project.description || t('projects:detail.overview.noDescription'),
                  span: 2,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">{t('projects:detail.overview.milestones')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('projects:detail.overview.milestonesDescription')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              className="mx-auto"
              onDayClick={toggleDay}
              modifiers={{ completed: completedDates, pending: pendingDates }}
              modifiersClassNames={{
                completed: 'bg-success/15 text-foreground line-through decoration-success/60',
                pending: 'ring-1 ring-primary/40',
              }}
              aria-label={t('projects:detail.overview.calendarLabel')}
            />
            <Separator />
            <ul className="space-y-2">
              {pendingMilestones.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  {t('projects:detail.overview.milestonesDescription')}
                </li>
              ) : null}
              {pendingMilestones.map((milestone) => (
                <li key={milestone.id} className="flex items-center gap-3">
                  <Checkbox
                    checked={milestone.completed}
                    disabled={!canManage || milestoneMutation.isPending}
                    onCheckedChange={(checked) =>
                      milestoneMutation.mutate({
                        id: milestone.id,
                        completed: checked === true,
                      })
                    }
                    aria-label={milestone.title}
                  />
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                    <Circle className="size-3.5 shrink-0 text-primary" aria-hidden />
                    <span className="truncate">{milestone.title}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(milestone.date, i18n.language, { month: 'short', day: 'numeric' })}
                  </span>
                </li>
              ))}
            </ul>
            {completedMilestones.length > 0 ? (
              <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 px-0">
                    <ChevronDown
                      className={
                        showCompleted
                          ? 'size-4 rotate-180 transition-transform'
                          : 'size-4 transition-transform'
                      }
                      aria-hidden
                    />
                    {t('projects:detail.overview.hideCompleted')}
                    <span className="text-muted-foreground">({completedMilestones.length})</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="space-y-2 pt-1">
                    {completedMilestones.map((milestone) => (
                      <li key={milestone.id} className="flex items-center gap-3">
                        <Checkbox
                          checked
                          disabled={!canManage || milestoneMutation.isPending}
                          onCheckedChange={(checked) =>
                            milestoneMutation.mutate({
                              id: milestone.id,
                              completed: checked === true,
                            })
                          }
                          aria-label={milestone.title}
                        />
                        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-hidden />
                          <span className="truncate line-through">{milestone.title}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(milestone.date, i18n.language, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">{t('projects:detail.overview.attachments')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('projects:detail.overview.attachmentsDescription')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {detail.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('projects:detail.overview.noAttachments')}
              </p>
            ) : (
              <>
                {images.length > 0 ? (
                  <ImagePreview
                    images={images}
                    ariaLabel={t('projects:detail.overview.attachments')}
                  />
                ) : null}
                <ul className="divide-y rounded-lg border">
                  {detail.attachments.map((file) => (
                    <li key={file.id} className="flex items-center gap-3 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(file.size)} · {file.uploadedByName} ·{' '}
                          {formatDate(file.updatedAt, i18n.language, { dateStyle: 'medium' })}
                        </p>
                      </div>
                      {canManage ? (
                        <Popconfirm
                          title={t('projects:detail.overview.detachTitle', { file: file.name })}
                          description={t('projects:detail.overview.detachDescription')}
                          confirmLabel={t('common:actions.delete')}
                          onConfirm={() => detachMutation.mutate(file.id)}
                          pending={detachMutation.isPending}
                          destructive
                        >
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('projects:detail.overview.removeAttachment', {
                              file: file.name,
                            })}
                            disabled={detachMutation.isPending}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </Popconfirm>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {canManage ? (
              <Upload
                items={uploads}
                onFiles={(files) => void handleFiles(files)}
                onRemove={(item) =>
                  setUploads((current) => current.filter((entry) => entry.id !== item.id))
                }
                accept="image/svg+xml,image/png,image/jpeg,application/pdf,text/plain,text/markdown"
                label={t('projects:detail.overview.uploadLabel')}
                hint={t('projects:detail.overview.uploadHint')}
                browseLabel={t('projects:detail.overview.uploadBrowse')}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader className="gap-1">
          <CardTitle className="text-base">{t('projects:detail.overview.activity')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('projects:detail.overview.activityDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <Timeline
            items={timelineItems}
            emptyLabel={t('projects:detail.overview.activityEmpty')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
