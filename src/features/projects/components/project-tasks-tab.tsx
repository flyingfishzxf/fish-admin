import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AutoComplete,
  Combobox,
  DatePicker,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/react'

import { formatDate } from '@/lib/format'
import { parseDay } from '@fish-admin/react/internal/date'
import type { ProjectDetail, ProjectTask, ProjectTaskStatus } from '@/types'

import { createProjectTask, updateProjectTask } from '../api'

const TASK_STATUSES: ProjectTaskStatus[] = ['todo', 'doing', 'review', 'done']

export function ProjectTasksTab({
  detail,
  canManage,
}: {
  detail: ProjectDetail
  canManage: boolean
}) {
  const { t, i18n } = useTranslation(['projects', 'common'])
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState<string | undefined>()
  const [status, setStatus] = useState<ProjectTaskStatus>('todo')
  const [dueDate, setDueDate] = useState<string | undefined>()
  const [error, setError] = useState<string>()

  const project = detail.project
  const doneCount = detail.tasks.filter((task) => task.status === 'done').length
  const completion = detail.tasks.length ? Math.round((doneCount / detail.tasks.length) * 100) : 0

  const memberOptions = useMemo(
    () =>
      project.memberIds.map((id, index) => ({
        value: id,
        label: project.memberNames[index] ?? id,
      })),
    [project.memberIds, project.memberNames],
  )

  const suggestions = useMemo(
    () =>
      [
        t('projects:detail.tasks.suggestions.scope'),
        t('projects:detail.tasks.suggestions.design'),
        t('projects:detail.tasks.suggestions.contract'),
        t('projects:detail.tasks.suggestions.implementation'),
        t('projects:detail.tasks.suggestions.quality'),
        t('projects:detail.tasks.suggestions.launch'),
      ].map((label) => ({ value: label, label })),
    [t],
  )

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['projects'] })
    void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createProjectTask(project.id, {
        title: title.trim(),
        status,
        assigneeId,
        dueDate: dueDate ? parseDay(dueDate)?.toISOString() : undefined,
      }),
    onSuccess: () => {
      invalidate()
      toast.success(t('projects:detail.tasks.created'))
      setDialogOpen(false)
      setTitle('')
      setAssigneeId(undefined)
      setStatus('todo')
      setDueDate(undefined)
      setError(undefined)
    },
    onError: (mutationError) => {
      setError(t('projects:detail.tasks.createFailed'))
      toast.error(
        mutationError instanceof Error && mutationError.message
          ? mutationError.message
          : t('projects:detail.tasks.createFailed'),
      )
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ task, next }: { task: ProjectTask; next: ProjectTaskStatus }) =>
      updateProjectTask(project.id, task.id, { status: next }),
    onSuccess: () => invalidate(),
    onError: () => toast.error(t('projects:detail.tasks.updateFailed')),
  })

  function submit() {
    if (title.trim().length < 2) {
      setError(t('projects:validation.required', { label: t('projects:detail.tasks.taskTitle') }))
      return
    }
    createMutation.mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{t('projects:detail.tasks.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('projects:detail.tasks.description')}</p>
        </div>
        {canManage ? (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            {t('projects:detail.tasks.add')}
          </Button>
        ) : null}
      </div>

      {detail.tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {t('projects:detail.tasks.empty')}
        </p>
      ) : (
        <>
          <div className="space-y-1.5 rounded-xl border p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {t('projects:card.tasks', { done: doneCount, total: detail.tasks.length })}
              </span>
              <span>{completion}%</span>
            </div>
            <Progress value={completion} aria-label={t('projects:detail.overview.progress')} />
          </div>

          <Accordion
            type="multiple"
            defaultValue={['todo', 'doing']}
            className="rounded-xl border px-4"
          >
            {TASK_STATUSES.map((taskStatus) => {
              const tasks = detail.tasks.filter((task) => task.status === taskStatus)
              return (
                <AccordionItem key={taskStatus} value={taskStatus}>
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      {t(`projects:detail.tasks.group`, {
                        status: t(`projects:detail.tasks.statuses.${taskStatus}`),
                        count: tasks.length,
                      })}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {tasks.length === 0 ? (
                      <p className="pb-2 text-sm text-muted-foreground">
                        {t('projects:detail.tasks.empty')}
                      </p>
                    ) : (
                      <ul className="space-y-2 pb-2">
                        {tasks.map((task) => {
                          const assigneeIndex = task.assigneeId
                            ? project.memberIds.indexOf(task.assigneeId)
                            : -1
                          const assigneeName =
                            assigneeIndex >= 0
                              ? project.memberNames[assigneeIndex]
                              : task.assigneeName
                          return (
                            <li
                              key={task.id}
                              className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{task.title}</p>
                                <p className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>
                                    {assigneeName ?? t('projects:detail.tasks.unassigned')}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarClock className="size-3.5" aria-hidden />
                                    {formatDate(task.dueDate, i18n.language, {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </p>
                              </div>
                              <Select
                                value={task.status}
                                onValueChange={(next) =>
                                  statusMutation.mutate({
                                    task,
                                    next: next as ProjectTaskStatus,
                                  })
                                }
                                disabled={!canManage || statusMutation.isPending}
                              >
                                <SelectTrigger
                                  className="h-8 w-[8.5rem]"
                                  aria-label={t('projects:detail.tasks.status')}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TASK_STATUSES.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {t(`projects:detail.tasks.statuses.${option}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('projects:detail.tasks.addTitle')}</DialogTitle>
            <DialogDescription>{t('projects:detail.tasks.addDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">{t('projects:detail.tasks.taskTitle')}</Label>
              <AutoComplete
                id="task-title"
                options={suggestions}
                value={title}
                onValueChange={setTitle}
                placeholder={t('projects:detail.tasks.titlePlaceholder')}
                ariaLabel={t('projects:detail.tasks.taskTitle')}
                emptyLabel={t('common:states.empty.title')}
              />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">{t('projects:detail.tasks.assignee')}</Label>
              <Combobox
                id="task-assignee"
                options={memberOptions}
                value={assigneeId}
                onChange={setAssigneeId}
                onClear={() => setAssigneeId(undefined)}
                placeholder={t('projects:detail.tasks.unassigned')}
                searchPlaceholder={t('common:actions.search')}
                emptyLabel={t('common:states.empty.title')}
                ariaLabel={t('projects:detail.tasks.assignee')}
                clearLabel={t('common:actions.clearSearch')}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="task-status">{t('projects:detail.tasks.status')}</Label>
                <Select
                  value={status}
                  onValueChange={(next) => setStatus(next as ProjectTaskStatus)}
                >
                  <SelectTrigger id="task-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`projects:detail.tasks.statuses.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('projects:fields.dueDate')}</Label>
                <DatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder={t('projects:fields.dueDate')}
                  ariaLabel={t('projects:fields.dueDate')}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button onClick={submit} disabled={createMutation.isPending}>
              {t('projects:detail.tasks.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
