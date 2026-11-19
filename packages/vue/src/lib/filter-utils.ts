import type { FilterField, FilterValue } from './query-filter-types'

function hasValue(value: unknown) {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

export function getFilterFieldId(field: FilterField) {
  return field.type === 'dateRange' ? field.fromName : field.name
}

export function isFilterFieldActive(field: FilterField, value: FilterValue) {
  switch (field.type) {
    case 'text':
    case 'select':
    case 'custom':
      return hasValue(value[field.name])
    case 'boolean':
      return value[field.name] === true
    case 'dateRange':
      return hasValue(value[field.fromName]) || hasValue(value[field.toName])
  }
}

export function getActiveFilterIds(fields: FilterField[], value: FilterValue) {
  return fields.filter((field) => isFilterFieldActive(field, value)).map(getFilterFieldId)
}

export function countActiveFilters(fields: FilterField[], value: FilterValue) {
  return getActiveFilterIds(fields, value).length
}

export function clearFilterValues(_fields: FilterField[]): FilterValue {
  return {}
}
