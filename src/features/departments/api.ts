import { apiRequest } from '@/lib/api-client'
import type { Department } from '@/types'

export interface DepartmentInput {
  name: string
  parentId?: string | null
}

export function fetchDepartments() {
  return apiRequest<{ items: Department[] }>('/departments')
}

export function createDepartment(input: DepartmentInput) {
  return apiRequest<Department>('/departments', { method: 'POST', body: input })
}

export function updateDepartment(id: string, input: DepartmentInput) {
  return apiRequest<Department>(`/departments/${id}`, { method: 'PATCH', body: input })
}
