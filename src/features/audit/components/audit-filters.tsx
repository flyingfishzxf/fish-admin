import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DateRangePicker,
  type DateRangePreset,
} from '@/components/enterprise/date-range-picker/date-range-picker'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/config/audit'
import type { AuditAction, AuditEntityType } from '@/types'

import { auditRangePreset, type AuditRangePreset, type AuditSearch } from '../search'

const PRESET_ORDER: AuditRangePreset[] = ['today', 'last7', 'last30', 'last90', 'thisMonth']

export function AuditFilters({
  search,
  onSearchChange,
  onClear,
}: {
  search: AuditSearch
  onSearchChange: (updater: (previous: AuditSearch) => AuditSearch) => void
  onClear: () => void
}) {
  const { t } = useTranslation()

  const presets = useMemo<DateRangePreset[]>(
    () =>
      PRESET_ORDER.map((preset) => ({
        label: t(`audit:presets.${preset}`),
        ...auditRangePreset(preset),
      })),
    [t],
  )

  const hasFilters = Boolean(
    search.q || search.action || search.entityType || search.from || search.to,
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={search.action ?? 'all'}
        onValueChange={(value) =>
          onSearchChange((previous) => ({
            ...previous,
            action: value === 'all' ? undefined : (value as AuditAction),
            page: 1,
          }))
        }
      >
        <SelectTrigger className="h-9 w-[10.5rem]" aria-label={t('audit:filters.action')}>
          <SelectValue placeholder={t('audit:filters.allActions')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('audit:filters.allActions')}</SelectItem>
          {AUDIT_ACTIONS.map((action) => (
            <SelectItem key={action} value={action}>
              {t(`audit:actions.${action}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={search.entityType ?? 'all'}
        onValueChange={(value) =>
          onSearchChange((previous) => ({
            ...previous,
            entityType: value === 'all' ? undefined : (value as AuditEntityType),
            page: 1,
          }))
        }
      >
        <SelectTrigger className="h-9 w-[9.5rem]" aria-label={t('audit:filters.entity')}>
          <SelectValue placeholder={t('audit:filters.allEntities')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('audit:filters.allEntities')}</SelectItem>
          {AUDIT_ENTITY_TYPES.map((entityType) => (
            <SelectItem key={entityType} value={entityType}>
              {t(`audit:entities.${entityType}`)}
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
        placeholder={t('audit:filters.dateRange')}
        ariaLabel={t('audit:filters.dateRange')}
        presets={presets}
        className="h-9 w-full sm:w-[15rem]"
      />

      {hasFilters ? (
        <Button variant="ghost" size="sm" className="h-9" onClick={onClear}>
          {t('audit:filters.clear')}
        </Button>
      ) : null}
    </div>
  )
}
