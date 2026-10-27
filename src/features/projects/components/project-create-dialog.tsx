import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Combobox,
  DatePicker,
  Stepper,
  TagsInput,
  type TreeItem,
  TreeSelect,
  ProForm,
  type ProFormField,
  type ProFormValues,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
} from '@fish-admin/react'

import { useDepartmentsQuery } from '@/features/departments/queries'
import { ApiError } from '@/lib/api-error'
import { formatDayValue } from '@fish-admin/react/internal/date'
import type { Department, ProjectPriority, ProjectStatus } from '@/types'

import { createProject } from '../api'
import { useProjectUserOptionsQuery } from '../queries'

interface ProjectBasics {
  name: string
  key: string
  description: string
  status: ProjectStatus
  priority: ProjectPriority
}

const DEFAULT_BASICS: ProjectBasics = {
  name: '',
  key: '',
  description: '',
  status: 'planning',
  priority: 'medium',
}

function toTreeItems(departments: Department[]): TreeItem[] {
  return departments.map((department) => ({
    id: department.id,
    parentId: department.parentId,
    label: department.name,
    description: department.parentId ? undefined : `${department.memberCount}`,
  }))
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  currentUserId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId?: string
}) {
  const { t } = useTranslation('projects')
  const queryClient = useQueryClient()
  const users = useProjectUserOptionsQuery()
  const departments = useDepartmentsQuery()

  const [step, setStep] = useState(0)
  const [basics, setBasics] = useState<ProjectBasics>(DEFAULT_BASICS)
  const [ownerId, setOwnerId] = useState<string | undefined>(currentUserId)
  const [departmentId, setDepartmentId] = useState<string | undefined>()
  const [startDate, setStartDate] = useState(() => formatDayValue(new Date()))
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return formatDayValue(date)
  })
  const [budget, setBudget] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [featured, setFeatured] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ownerId && users.data?.length) setOwnerId(currentUserId ?? users.data[0].id)
  }, [currentUserId, ownerId, users.data])

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
      toast.success(t('create.created'))
      handleOpenChange(false)
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof ApiError && mutationError.code === 'KEY_TAKEN'
          ? t('validation.keyTaken')
          : t('create.error')
      setError(message)
      toast.error(message)
    },
  })

  function reset() {
    setStep(0)
    setBasics(DEFAULT_BASICS)
    setDepartmentId(undefined)
    setStartDate(formatDayValue(new Date()))
    const due = new Date()
    due.setDate(due.getDate() + 30)
    setDueDate(formatDayValue(due))
    setBudget('')
    setTags([])
    setFeatured(false)
    setError(null)
    mutation.reset()
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  const basicFields: ProFormField[] = [
    {
      name: 'name',
      label: t('fields.name'),
      placeholder: t('fields.namePlaceholder'),
      required: true,
      minLength: 2,
      maxLength: 60,
    },
    {
      name: 'key',
      label: t('fields.key'),
      placeholder: t('fields.keyPlaceholder'),
      description: t('fields.keyHint'),
      required: true,
      minLength: 2,
      maxLength: 6,
    },
    {
      name: 'description',
      label: t('fields.description'),
      type: 'textarea',
      placeholder: t('fields.descriptionPlaceholder'),
      maxLength: 240,
      colSpan: 2,
    },
    {
      name: 'status',
      label: t('fields.status'),
      type: 'select',
      required: true,
      options: (['planning', 'active', 'review', 'done'] as const).map((status) => ({
        value: status,
        label: t(`status.${status}`),
      })),
    },
    {
      name: 'priority',
      label: t('fields.priority'),
      type: 'select',
      required: true,
      options: (['low', 'medium', 'high'] as const).map((priority) => ({
        value: priority,
        label: t(`priority.${priority}`),
      })),
    },
  ]

  function handleBasicsSubmit(values: ProFormValues) {
    setBasics({
      name: String(values.name ?? '').trim(),
      key: String(values.key ?? '')
        .trim()
        .toUpperCase(),
      description: String(values.description ?? '').trim(),
      status: values.status as ProjectStatus,
      priority: values.priority as ProjectPriority,
    })
    setError(null)
    setStep(1)
  }

  function handleCreate() {
    setError(null)
    if (!ownerId) {
      setError(t('validation.required', { label: t('fields.owner') }))
      return
    }
    if (dueDate < startDate) {
      setError(t('validation.dateOrder'))
      return
    }
    const budgetValue = budget ? Number(budget) : 0
    if (!Number.isFinite(budgetValue) || budgetValue < 0) {
      setError(t('validation.required', { label: t('fields.budget') }))
      return
    }

    mutation.mutate({
      ...basics,
      ownerId,
      memberIds: [ownerId],
      departmentId,
      tags,
      budget: Math.round(budgetValue),
      startDate: new Date(`${startDate}T00:00:00`).toISOString(),
      dueDate: new Date(`${dueDate}T00:00:00`).toISOString(),
      featured,
    })
  }

  const steps = [
    { id: 'basics', title: t('create.stepBasics'), description: t('create.stepBasicsDescription') },
    {
      id: 'schedule',
      title: t('create.stepSchedule'),
      description: t('create.stepScheduleDescription'),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('create.title')}</DialogTitle>
          <DialogDescription>{t('create.description')}</DialogDescription>
        </DialogHeader>

        <Stepper steps={steps} current={step} ariaLabel={t('create.stepsLabel')} />

        {step === 0 ? (
          <ProForm
            key="basics"
            fields={basicFields}
            defaultValues={{
              name: basics.name,
              key: basics.key,
              description: basics.description,
              status: basics.status,
              priority: basics.priority,
            }}
            onSubmit={handleBasicsSubmit}
            validateMessage={(rule, label, limit) => t(`validation.${rule}`, { label, limit })}
            submitLabel={t('create.next')}
            ariaLabel={t('create.title')}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('fields.owner')}</Label>
                <Combobox
                  options={(users.data ?? []).map((user) => ({
                    value: user.id,
                    label: user.name,
                    description: user.email,
                  }))}
                  value={ownerId ?? null}
                  onChange={setOwnerId}
                  placeholder={t('fields.ownerPlaceholder')}
                  searchPlaceholder={t('detail.members.search')}
                  ariaLabel={t('fields.owner')}
                  disabled={users.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('fields.department')}</Label>
                <TreeSelect
                  items={toTreeItems(departments.data ?? [])}
                  value={departmentId ?? null}
                  onChange={setDepartmentId}
                  onClear={() => setDepartmentId(undefined)}
                  placeholder={t('fields.departmentPlaceholder')}
                  ariaLabel={t('fields.department')}
                  disabled={departments.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('fields.startDate')}</Label>
                <DatePicker
                  value={startDate}
                  onChange={(value) => setStartDate(value ?? formatDayValue(new Date()))}
                  placeholder={t('fields.startDate')}
                  ariaLabel={t('fields.startDate')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('fields.dueDate')}</Label>
                <DatePicker
                  value={dueDate}
                  min={startDate}
                  onChange={(value) => setDueDate(value ?? dueDate)}
                  placeholder={t('fields.dueDate')}
                  ariaLabel={t('fields.dueDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-budget">{t('fields.budget')}</Label>
                <Input
                  id="project-budget"
                  type="number"
                  min={0}
                  step={1000}
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="50000"
                />
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-2 pb-2">
                  <Switch id="project-featured" checked={featured} onCheckedChange={setFeatured} />
                  <Label htmlFor="project-featured">{t('fields.featured')}</Label>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>{t('fields.tags')}</Label>
                <TagsInput
                  value={tags}
                  onChange={setTags}
                  placeholder={t('fields.tagsPlaceholder')}
                  ariaLabel={t('fields.tags')}
                  maxTags={6}
                />
              </div>
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(0)} disabled={mutation.isPending}>
                {t('create.back')}
              </Button>
              <Button onClick={handleCreate} disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t('create.submit')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
