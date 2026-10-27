import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchUsers } from '@/features/users/api'

import {
  fetchWorkflow,
  fetchWorkflowApprovers,
  fetchWorkflows,
  type WorkflowListParams,
} from './api'

export const workflowListQueryOptions = (params: WorkflowListParams) =>
  queryOptions({
    queryKey: ['workflows', 'list', params],
    queryFn: ({ signal }) => fetchWorkflows(params, signal),
    placeholderData: keepPreviousData,
  })

export function useWorkflowListQuery(params: WorkflowListParams) {
  return useQuery(workflowListQueryOptions(params))
}

export const workflowDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['workflows', 'detail', id],
    queryFn: ({ signal }) => fetchWorkflow(id, signal),
  })

export function useWorkflowDetailQuery(id: string) {
  return useQuery(workflowDetailQueryOptions(id))
}

export const workflowApproversQueryOptions = () =>
  queryOptions({
    queryKey: ['workflows', 'approvers'],
    queryFn: ({ signal }) => fetchWorkflowApprovers(signal),
    staleTime: 5 * 60_000,
  })

export function useWorkflowApproversQuery(enabled: boolean) {
  return useQuery({ ...workflowApproversQueryOptions(), enabled })
}

export const workflowInitiatorOptionsQueryOptions = () =>
  queryOptions({
    queryKey: ['workflows', 'initiators'],
    queryFn: ({ signal }) =>
      fetchUsers({ page: 1, pageSize: 100, sort: 'name', order: 'asc' }, signal),
    select: (data) =>
      data.items.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })),
    staleTime: 5 * 60_000,
  })

export function useWorkflowInitiatorOptionsQuery() {
  return useQuery(workflowInitiatorOptionsQueryOptions())
}
