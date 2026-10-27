import { apiRequest } from '@/lib/api-client'
import type {
  PaginatedResult,
  WorkflowComment,
  WorkflowDecision,
  WorkflowDetail,
  WorkflowInstance,
  WorkflowStatus,
  WorkflowType,
} from '@/types'

export type WorkflowView = 'mine' | 'pending' | 'all'

export interface WorkflowListParams {
  page: number
  pageSize: number
  view: WorkflowView
  q?: string
  status?: WorkflowStatus
  type?: WorkflowType
  initiatorId?: string
  from?: string
  to?: string
}

export interface WorkflowApproverOption {
  id: string
  name: string
  jobTitle?: string
  department: string
}

export function fetchWorkflows(params: WorkflowListParams, signal?: AbortSignal) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  search.set('view', params.view)
  if (params.q) search.set('q', params.q)
  if (params.status) search.set('status', params.status)
  if (params.type) search.set('type', params.type)
  if (params.initiatorId) search.set('initiatorId', params.initiatorId)
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)

  return apiRequest<PaginatedResult<WorkflowInstance>>(`/workflows?${search.toString()}`, {
    signal,
  })
}

export function fetchWorkflow(id: string, signal?: AbortSignal) {
  return apiRequest<WorkflowDetail>(`/workflows/${encodeURIComponent(id)}`, { signal })
}

export function fetchWorkflowApprovers(signal?: AbortSignal) {
  return apiRequest<WorkflowApproverOption[]>('/workflows/approvers', { signal })
}

export interface WorkflowDecisionInput {
  decision: WorkflowDecision
  comment?: string
  transferToId?: string
}

export function decideWorkflow(id: string, input: WorkflowDecisionInput) {
  return apiRequest<WorkflowDetail>(`/workflows/${encodeURIComponent(id)}/decisions`, {
    method: 'POST',
    body: input,
  })
}

export function addWorkflowComment(id: string, body: string) {
  return apiRequest<WorkflowComment[]>(`/workflows/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    body: { body },
  })
}
