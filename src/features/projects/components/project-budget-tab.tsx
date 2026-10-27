import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  EditableTable,
  type EditableTableRow,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
} from '@fish-admin/react'

import { formatCurrency } from '@/lib/format'
import type { ProjectDetail } from '@/types'

import { updateProject } from '../api'

export function ProjectBudgetTab({
  detail,
  canManage,
}: {
  detail: ProjectDetail
  canManage: boolean
}) {
  const { t, i18n } = useTranslation(['projects', 'common'])
  const queryClient = useQueryClient()
  const project = detail.project
  const [rows, setRows] = useState<EditableTableRow[]>(() =>
    project.budgetItems.map((item) => ({ ...item })),
  )

  useEffect(() => {
    setRows(project.budgetItems.map((item) => ({ ...item })))
  }, [project.budgetItems])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProject(project.id, {
        budgetItems: rows.map((row) => ({
          id: String(row.id),
          label: String(row.label ?? ''),
          amount: Number(row.amount ?? 0),
        })),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
      toast.success(t('projects:detail.budget.saved'))
    },
    onError: () => toast.error(t('projects:detail.budget.saveFailed')),
  })

  const spent = rows.reduce((total, row) => total + Number(row.amount ?? 0), 0)
  const remaining = project.budget - spent
  const utilization = project.budget > 0 ? Math.round((spent / project.budget) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t('projects:detail.budget.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('projects:detail.budget.description')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('projects:detail.budget.budgeted')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(project.budget, i18n.language)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('projects:detail.budget.spent')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">{formatCurrency(spent, i18n.language)}</p>
            <div className="flex items-center gap-2">
              <Progress
                value={Math.min(utilization, 100)}
                aria-label={t('projects:detail.budget.utilization')}
              />
              <span className="text-xs text-muted-foreground">{utilization}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('projects:detail.budget.remaining')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={
                remaining < 0 ? 'text-2xl font-semibold text-destructive' : 'text-2xl font-semibold'
              }
            >
              {formatCurrency(remaining, i18n.language)}
            </p>
          </CardContent>
        </Card>
      </div>

      <EditableTable
        ariaLabel={t('projects:detail.budget.title')}
        rows={rows}
        onRowsChange={setRows}
        addRow={() => ({
          id: crypto.randomUUID(),
          label: '',
          amount: 0,
        })}
        rowLabel={(row) => String(row.label ?? '')}
        columns={[
          {
            key: 'label',
            header: t('projects:detail.budget.label'),
            editor: 'text',
            validate: (value) =>
              typeof value === 'string' && value.trim()
                ? null
                : t('projects:detail.budget.labelRequired'),
          },
          {
            key: 'amount',
            header: t('projects:detail.budget.amount'),
            editor: 'number',
            align: 'right',
            parse: (raw) => Number(raw),
            validate: (value) =>
              Number.isFinite(Number(value)) && Number(value) >= 0
                ? null
                : t('projects:detail.budget.amountInvalid'),
          },
        ]}
        labels={{
          add: t('projects:detail.budget.add'),
          save: t('common:actions.save'),
          cancel: t('common:actions.cancel'),
          edit: t('projects:detail.budget.edit'),
          delete: t('projects:detail.budget.delete'),
          actions: t('projects:detail.budget.actions'),
          empty: t('projects:detail.budget.empty'),
        }}
      />

      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {t('projects:detail.budget.save')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
