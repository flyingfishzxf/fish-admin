import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DateRangePicker,
  type DateRangePreset,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/react'

import { useWorkflowInitiatorOptionsQuery } from '../queries'
import {
  workflowRangePreset,
  WORKFLOW_STATUSES,
  WORKFLOW_TYPES,
  type WorkflowRangePreset,
  type WorkflowSearch,
} from '../search'

const PRESET_ORDER: WorkflowRangePreset[] = ['today', 'last7', 'last30', 'last90', 'thisMonth']

export function WorkflowFilters({
  search,
  onSearchChange,
  onClear,
}: {
  search: WorkflowSearch
  onSearchChange: (updater: (previous: WorkflowSearch) => WorkflowSearch) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const initiators = useWorkflowInitiatorOptionsQuery()

  const presets = useMemo<DateRangePreset[]>(
    () =>
      PRESET_ORDER.map((preset) => ({
        label: t(`workflows:presets.${preset}`),
        ...workflowRangePreset(preset),
      })),
    [t],
  )

  const hasFilters = Boolean(
    search.q || search.status || search.type || search.initiatorId || search.from || search.to,
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={search.status ?? 'all'}
        onValueChange={(value) =>
          onSearchChange((previous) => ({
            ...previous,
            status: value === 'all' ? undefined : (value as WorkflowSearch['status']),
            page: 1,
          }))
        }
      >
        <SelectTrigger className="h-9 w-[10rem]" aria-label={t('workflows:filters.status')}>
          <SelectValue placeholder={t('workflows:filters.allStatuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('workflows:filters.allStatuses')}</SelectItem>
          {WORKFLOW_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {t(`workflows:status.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={search.type ?? 'all'}
        onValueChange={(value) =>
          onSearchChange((previous) => ({
            ...previous,
            type: value === 'all' ? undefined : (value as WorkflowSearch['type']),
            page: 1,
          }))
        }
      >
        <SelectTrigger className="h-9 w-[9.5rem]" aria-label={t('workflows:filters.type')}>
          <SelectValue placeholder={t('workflows:filters.allTypes')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('workflows:filters.allTypes')}</SelectItem>
          {WORKFLOW_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {t(`workflows:types.${type}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={search.initiatorId ?? 'all'}
        onValueChange={(value) =>
          onSearchChange((previous) => ({
            ...previous,
            initiatorId: value === 'all' ? undefined : value,
            page: 1,
          }))
        }
      >
        <SelectTrigger className="h-9 w-[11rem]" aria-label={t('workflows:filters.initiator')}>
          <SelectValue placeholder={t('workflows:filters.allInitiators')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('workflows:filters.allInitiators')}</SelectItem>
          {(initiators.data ?? []).map((initiator) => (
            <SelectItem key={initiator.id} value={initiator.id}>
              {initiator.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker
        value={{ from: search.from, to: search.to }}
        onChange={(range) =>
          onSearchChange((previous) => ({
            ...previous,
            from: range.from,
            to: range.to,
            page: 1,
          }))
        }
        placeholder={t('workflows:filters.dateRange')}
        ariaLabel={t('workflows:filters.dateRange')}
        presets={presets}
        className="h-9 w-full sm:w-[15rem]"
      />

      {hasFilters ? (
        <Button variant="ghost" size="sm" className="h-9" onClick={onClear}>
          {t('workflows:filters.clear')}
        </Button>
      ) : null}
    </div>
  )
}
