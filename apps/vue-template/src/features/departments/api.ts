import type { Department } from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

export interface DepartmentInput {
  name: string
  parentId?: string | null
}

// The mock API exposes a tree-ordered list plus create/rename, but no
// GET /departments/:id; the detail panel resolves its record from `items`.
export function fetchDepartments(signal?: AbortSignal) {
  return apiRequest<{ items: Department[] }>('/departments', { signal })
}

export function createDepartment(input: DepartmentInput) {
  return apiRequest<Department>('/departments', { method: 'POST', body: input })
}

export function updateDepartment(id: string, input: Partial<DepartmentInput>) {
  return apiRequest<Department>(`/departments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  })
}
