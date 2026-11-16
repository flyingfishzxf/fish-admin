import { keepPreviousData, queryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import {
  fetchProject,
  fetchProjectActivity,
  fetchProjectDepartments,
  fetchProjects,
  fetchProjectUserOptions,
  type ProjectListParams,
} from './api'

export function projectListQueryOptions(params: MaybeRef<ProjectListParams>) {
  return queryOptions({
    queryKey: computed(() => ['projects', 'list', unref(params)]),
    queryFn: ({ signal }) => fetchProjects(unref(params), signal),
    placeholderData: keepPreviousData,
  })
}

/** The portfolio KPI card ignores the list filters, so it asks for everything. */
export const projectOverviewQueryOptions = queryOptions({
  queryKey: ['projects', 'overview'],
  queryFn: ({ signal }) => fetchProjects({ page: 1, pageSize: 50, archived: false }, signal),
  select: (data) => data.items,
  staleTime: 30_000,
})

export function projectDetailQueryOptions(id: MaybeRef<string>) {
  return queryOptions({
    queryKey: computed(() => ['projects', 'detail', unref(id)]),
    queryFn: ({ signal }) => fetchProject(unref(id), signal),
  })
}

export const projectDepartmentsQueryOptions = queryOptions({
  queryKey: ['projects', 'departments'],
  queryFn: ({ signal }) => fetchProjectDepartments(signal),
  select: (data) => data.items,
  staleTime: 5 * 60_000,
})

export function projectActivityQueryOptions(id: MaybeRef<string>) {
  return queryOptions({
    queryKey: computed(() => ['projects', 'activity', unref(id)]),
    queryFn: ({ signal }) => fetchProjectActivity(unref(id), 8, signal),
  })
}

export const projectUserOptionsQueryOptions = queryOptions({
  queryKey: ['projects', 'user-options'],
  queryFn: ({ signal }) => fetchProjectUserOptions(signal),
  staleTime: 5 * 60_000,
})
