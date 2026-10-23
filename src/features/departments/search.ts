export interface DepartmentsSearch {
  dept?: string
}

export function validateDepartmentsSearch(search: Record<string, unknown>): DepartmentsSearch {
  const dept = typeof search.dept === 'string' ? search.dept.trim() : ''
  return dept ? { dept } : {}
}
