import { keepPreviousData, queryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import {
  fetchWorkflow,
  fetchWorkflowApprovers,
  fetchWorkflowInitiators,
  fetchWorkflows,
  type WorkflowListParams,
} from './api'

export function workflowListQueryOptions(params: MaybeRef<WorkflowListParams>) {
  return queryOptions({
    queryKey: computed(() => ['workflows', 'list', unref(params)]),
    queryFn: ({ signal }) => fetchWorkflows(unref(params), signal),
    placeholderData: keepPreviousData,
  })
}

export function workflowDetailQueryOptions(id: MaybeRef<string>) {
  return queryOptions({
    queryKey: computed(() => ['workflows', 'detail', unref(id)]),
    queryFn: ({ signal }) => fetchWorkflow(unref(id), signal),
  })
}

export const workflowApproversQueryOptions = queryOptions({
  queryKey: ['workflows', 'approvers'],
  queryFn: ({ signal }) => fetchWorkflowApprovers(signal),
  staleTime: 5 * 60_000,
})

export const workflowInitiatorOptionsQueryOptions = queryOptions({
  queryKey: ['workflows', 'initiators'],
  queryFn: ({ signal }) => fetchWorkflowInitiators(signal),
  staleTime: 5 * 60_000,
})
