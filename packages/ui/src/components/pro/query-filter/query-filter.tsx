import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

import { DateRangePicker } from '../../enterprise/date-range-picker/date-range-picker'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Switch } from '../../ui/switch'
import { cn } from '../../../lib/utils'

import { clearFilterValues, countActiveFilters } from './filter-utils'
import type { FilterField, FilterValue } from './query-filter-types'

const ALL_OPTION_VALUE = '__query-filter-all__'

function getFieldKey(field: FilterField) {
  return field.type === 'dateRange'
    ? `${field.type}:${field.fromName}:${field.toName}`
    : `${field.type}:${field.name}`
}

export function QueryFilter({
  fields,
  value,
  onChange,
  onReset,
  labels,
  maxVisible = 3,
  extra,
  className,
}: {
  fields: FilterField[]
  value: FilterValue
  onChange: (next: FilterValue) => void
  onReset?: () => void
  labels: { reset: string; more: string; less: string }
  maxVisible?: number
  extra?: ReactNode
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const visibleCount = Math.max(0, maxVisible)
  const canExpand = fields.length > visibleCount
  const visibleFields = expanded ? fields : fields.slice(0, visibleCount)
  const activeCount = countActiveFilters(fields, value)

  function handleReset() {
    onChange(clearFilterValues(fields))
    onReset?.()
  }

  return (
    <div data-slot="query-filter" className={cn('flex flex-col gap-3', className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleFields.map((field) => (
          <QueryFilterField
            key={getFieldKey(field)}
            field={field}
            value={value}
            onChange={onChange}
          />
        ))}
      </div>

      {canExpand || activeCount > 0 || extra ? (
        <div className="flex flex-wrap items-center gap-2">
          {canExpand ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              aria-expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              {expanded ? labels.less : labels.more}
            </Button>
          ) : null}
          {activeCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={handleReset}
            >
              <RotateCcw className="size-4" />
              {labels.reset}
            </Button>
          ) : null}
          {extra ? <div className="ml-auto">{extra}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

function QueryFilterField({
  field,
  value,
  onChange,
}: {
  field: FilterField
  value: FilterValue
  onChange: (next: FilterValue) => void
}) {
  const id = useId()

  if (field.type === 'text') {
    const raw = value[field.name]
    const textValue = typeof raw === 'string' ? raw : raw == null ? '' : String(raw)

    return (
      <div data-slot="query-filter-field" className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={id}>{field.label}</Label>
        <Input
          id={id}
          value={textValue}
          placeholder={field.placeholder}
          onChange={(event) => onChange({ ...value, [field.name]: event.target.value })}
          className="h-9"
        />
      </div>
    )
  }

  if (field.type === 'select') {
    const raw = value[field.name]
    const current = typeof raw === 'string' ? raw : ''
    const selectValue = current !== '' ? current : field.allLabel ? ALL_OPTION_VALUE : undefined

    return (
      <div data-slot="query-filter-field" className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={id}>{field.label}</Label>
        <Select
          value={selectValue}
          onValueChange={(next) =>
            onChange({ ...value, [field.name]: next === ALL_OPTION_VALUE ? '' : next })
          }
        >
          <SelectTrigger id={id} aria-label={field.label} className="h-9 w-full">
            <SelectValue placeholder={field.allLabel ?? field.label} />
          </SelectTrigger>
          <SelectContent>
            {field.allLabel ? (
              <SelectItem value={ALL_OPTION_VALUE}>{field.allLabel}</SelectItem>
            ) : null}
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (field.type === 'dateRange') {
    const rawFrom = value[field.fromName]
    const rawTo = value[field.toName]
    const from = typeof rawFrom === 'string' ? rawFrom : undefined
    const to = typeof rawTo === 'string' ? rawTo : undefined

    return (
      <div data-slot="query-filter-field" className="flex min-w-0 flex-col gap-1.5">
        <Label>{field.label}</Label>
        <DateRangePicker
          value={{ from, to }}
          onChange={(range) =>
            onChange({
              ...value,
              [field.fromName]: range.from ?? '',
              [field.toName]: range.to ?? '',
            })
          }
          placeholder={field.placeholder ?? field.label}
          ariaLabel={field.label}
          className="h-9 w-full"
        />
      </div>
    )
  }

  if (field.type === 'boolean') {
    return (
      <div data-slot="query-filter-field" className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={id}>{field.label}</Label>
        <div className="flex h-9 items-center">
          <Switch
            id={id}
            checked={value[field.name] === true}
            onCheckedChange={(checked) => onChange({ ...value, [field.name]: checked })}
          />
        </div>
      </div>
    )
  }

  return (
    <div data-slot="query-filter-field" className="flex min-w-0 flex-col gap-1.5">
      <Label>{field.label}</Label>
      <div role="group" aria-label={field.label} className="min-w-0">
        {field.render(value[field.name], (next) => onChange({ ...value, [field.name]: next }))}
      </div>
    </div>
  )
}
