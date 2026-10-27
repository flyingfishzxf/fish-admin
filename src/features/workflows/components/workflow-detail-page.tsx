import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCheck, CircleX, Forward, MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can } from '@/components/common/can'
import { ErrorState } from '@/components/common/error-state'
import {
  Descriptions,
  JsonViewer,
  Popconfirm,
  Timeline,
  type TimelineItem,
  type TimelineTone,
  DetailPage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
} from '@fish-admin/react'

import { PERMISSION_CODES } from '@/config/permissions'
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/format'
import { useDocumentTitle } from '@/lib/document-title'
import { useAuthStore } from '@/stores/auth-store'
import type { WorkflowComment, WorkflowDecision, WorkflowDetail, WorkflowStep } from '@/types'

import { addWorkflowComment, decideWorkflow, type WorkflowDecisionInput } from '../api'
import { useWorkflowApproversQuery, useWorkflowDetailQuery } from '../queries'
import { DEFAULT_WORKFLOWS_SEARCH } from '../search'
import { WorkflowCodeMark, WorkflowStatusBadge, WorkflowTypeBadge } from './workflow-badges'

const STEP_TONES: Record<WorkflowStep['action'], TimelineTone> = {
  submitted: 'default',
  approved: 'success',
  rejected: 'destructive',
  transferred: 'info',
}

const STEP_ICONS = {
  submitted: Send,
  approved: CheckCheck,
  rejected: CircleX,
  transferred: Forward,
} as const

export function WorkflowDetailPage({ workflowId }: { workflowId: string }) {
  const { t, i18n } = useTranslation(['workflows', 'common'])
  const query = useWorkflowDetailQuery(workflowId)
  const detail = query.data

  useDocumentTitle(
    detail
      ? `${detail.instance.code} · ${detail.instance.title}`
      : t('workflows:detail.notFoundTitle'),
  )

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  if (query.isError || !detail) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState
          title={t('workflows:detail.notFoundTitle')}
          description={t('workflows:detail.notFoundDescription')}
          onRetry={() => void query.refetch()}
        />
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/workflows" search={DEFAULT_WORKFLOWS_SEARCH}>
              {t('workflows:detail.notFoundAction')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const instance = detail.instance
  const snapshot = {
    code: instance.code,
    type: instance.type,
    status: instance.status,
    initiator: instance.initiatorName,
    ...(instance.amount !== undefined ? { amount: instance.amount } : {}),
    form: Object.fromEntries(instance.form.map((field) => [field.label, field.value])),
    approvers: instance.approverNames,
    createdAt: instance.createdAt,
    ...(instance.completedAt !== undefined ? { completedAt: instance.completedAt } : {}),
  }

  return (
    <DetailPage
      back={<BackLink />}
      avatar={<WorkflowCodeMark code={instance.code} />}
      title={instance.title}
      subtitle={instance.summary}
      badges={
        <>
          <WorkflowStatusBadge
            status={instance.status}
            label={t(`workflows:status.${instance.status}`)}
          />
          <WorkflowTypeBadge type={instance.type} label={t(`workflows:types.${instance.type}`)} />
        </>
      }
      meta={
        <>
          <span className="font-mono">{instance.code}</span>
          <span>{t('workflows:detail.initiatedBy', { name: instance.initiatorName })}</span>
          <span>
            {t('workflows:detail.createdAt', {
              date: formatDateTime(instance.createdAt, i18n.language),
            })}
          </span>
          {instance.amount !== undefined ? (
            <span>{formatCurrency(instance.amount, i18n.language)}</span>
          ) : null}
          <span>
            {instance.status === 'pending'
              ? t('workflows:detail.waitingFor', { name: instance.currentApproverName ?? '—' })
              : t('workflows:detail.closed')}
          </span>
        </>
      }
    >
      <DecisionPanel detail={detail} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('workflows:detail.formTitle')}</CardTitle>
              <CardDescription>{t('workflows:detail.formDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Descriptions
                items={instance.form.map((field) => ({
                  term: field.label,
                  description: field.value,
                }))}
              />
            </CardContent>
          </Card>

          <WorkflowComments instanceId={instance.id} comments={detail.comments} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('workflows:detail.timelineTitle')}</CardTitle>
              <CardDescription>{t('workflows:detail.timelineDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline items={buildTimeline(detail, t, i18n.language)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('workflows:detail.snapshotTitle')}</CardTitle>
              <CardDescription>{t('workflows:detail.snapshotDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <JsonViewer value={snapshot} ariaLabel={t('workflows:detail.snapshotRaw')} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DetailPage>
  )
}

function BackLink() {
  const { t } = useTranslation('workflows')
  return (
    <Button asChild variant="ghost" size="sm" className="gap-1.5">
      <Link to="/workflows" search={DEFAULT_WORKFLOWS_SEARCH}>
        <ArrowLeft className="size-4" />
        {t('detail.back')}
      </Link>
    </Button>
  )
}

function buildTimeline(detail: WorkflowDetail, t: TFunction, language: string): TimelineItem[] {
  return detail.steps.map((step) => {
    const title =
      step.action === 'submitted'
        ? t('workflows:timeline.submitted', { name: step.actorName })
        : step.action === 'approved'
          ? t('workflows:timeline.approved', { name: step.actorName })
          : step.action === 'rejected'
            ? t('workflows:timeline.rejected', { name: step.actorName })
            : t('workflows:timeline.transferred', {
                name: step.actorName,
                approver: step.approverName ?? '—',
              })

    return {
      id: step.id,
      title,
      description: step.comment,
      timestamp: formatDateTime(step.createdAt, language),
      icon: STEP_ICONS[step.action],
      tone: STEP_TONES[step.action],
    }
  })
}

function DecisionPanel({ detail }: { detail: WorkflowDetail }) {
  const { t } = useTranslation(['workflows', 'common'])
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)
  const instance = detail.instance
  const actionable = instance.status === 'pending' && instance.currentApproverId === userId

  const approvers = useWorkflowApproversQuery(actionable)
  const [transferTo, setTransferTo] = useState('')
  const [note, setNote] = useState('')

  const mutation = useMutation({
    mutationFn: (input: WorkflowDecisionInput) => decideWorkflow(instance.id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflows'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
      setNote('')
      setTransferTo('')
      toast.success(t('workflows:actions.done'))
    },
    onError: () => toast.error(t('workflows:actions.failed')),
  })

  const decide = (decision: WorkflowDecision) => {
    mutation.mutate({
      decision,
      comment: note.trim() || undefined,
      transferToId: decision === 'transfer' ? transferTo : undefined,
    })
  }

  if (!actionable) return null

  const targets = (approvers.data ?? []).filter((approver) => approver.id !== userId)
  const selected = targets.find((approver) => approver.id === transferTo)

  return (
    <Can permission={PERMISSION_CODES.workflowApprove}>
      <Card>
        <CardHeader>
          <CardTitle>{t('workflows:actions.title')}</CardTitle>
          <CardDescription>{t('workflows:actions.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('workflows:actions.notePlaceholder')}
            aria-label={t('workflows:actions.note')}
            rows={2}
            maxLength={1000}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Popconfirm
              title={t('workflows:actions.approveTitle')}
              description={t('workflows:actions.approveDescription')}
              confirmLabel={t('workflows:actions.approve')}
              onConfirm={() => decide('approve')}
              pending={mutation.isPending}
            >
              <Button disabled={mutation.isPending}>
                <CheckCheck className="size-4" />
                {t('workflows:actions.approve')}
              </Button>
            </Popconfirm>

            <Popconfirm
              title={t('workflows:actions.rejectTitle')}
              description={t('workflows:actions.rejectDescription')}
              confirmLabel={t('workflows:actions.reject')}
              onConfirm={() => decide('reject')}
              pending={mutation.isPending}
              destructive
            >
              <Button variant="outline" disabled={mutation.isPending}>
                <CircleX className="size-4" />
                {t('workflows:actions.reject')}
              </Button>
            </Popconfirm>

            <Select value={transferTo} onValueChange={setTransferTo}>
              <SelectTrigger
                className="h-9 w-[13rem]"
                aria-label={t('workflows:actions.transferTo')}
              >
                <SelectValue placeholder={t('workflows:actions.transferTo')} />
              </SelectTrigger>
              <SelectContent>
                {targets.map((approver) => (
                  <SelectItem key={approver.id} value={approver.id}>
                    {approver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popconfirm
              title={t('workflows:actions.transferTitle')}
              description={
                selected
                  ? t('workflows:actions.transferDescription', { name: selected.name })
                  : t('workflows:actions.transferPlaceholder')
              }
              confirmLabel={t('workflows:actions.transfer')}
              onConfirm={() => decide('transfer')}
              pending={mutation.isPending}
              disabled={!selected || mutation.isPending}
            >
              <Button variant="outline" disabled={!selected || mutation.isPending}>
                <Forward className="size-4" />
                {t('workflows:actions.transfer')}
              </Button>
            </Popconfirm>
          </div>
        </CardContent>
      </Card>
    </Can>
  )
}

function WorkflowComments({
  instanceId,
  comments,
}: {
  instanceId: string
  comments: WorkflowComment[]
}) {
  const { t, i18n } = useTranslation(['workflows', 'common'])
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')

  const mutation = useMutation({
    mutationFn: (text: string) => addWorkflowComment(instanceId, text),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setBody('')
    },
    onError: () => toast.error(t('workflows:comments.failed')),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('workflows:comments.title')}</CardTitle>
        <CardDescription>{t('workflows:comments.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('workflows:comments.empty')}</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <MessageSquare className="size-4" />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{comment.authorName}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt, i18n.language)}
                    </span>
                  </div>
                  <p className="text-sm break-words text-muted-foreground">{comment.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          className="space-y-2 border-t pt-4"
          onSubmit={(event) => {
            event.preventDefault()
            const text = body.trim()
            if (!text) return
            mutation.mutate(text)
          }}
        >
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t('workflows:comments.placeholder')}
            aria-label={t('workflows:comments.label')}
            rows={2}
            maxLength={1000}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!body.trim() || mutation.isPending}>
              {t('workflows:comments.submit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
