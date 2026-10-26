import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchUsers } from '@/features/users/api'

import { fetchProject, fetchProjects, type ProjectListParams } from './api'

export const projectListQueryOptions = (params: ProjectListParams) =>
  queryOptions({
    queryKey: ['projects', params],
    queryFn: ({ signal }) => fetchProjects(params, signal),
    placeholderData: keepPreviousData,
  })

export function useProjectListQuery(params: ProjectListParams) {
  return useQuery(projectListQueryOptions(params))
}

export const projectOverviewQueryOptions = () =>
  queryOptions({
    queryKey: ['projects', 'overview'],
    queryFn: ({ signal }) => fetchProjects({ page: 1, pageSize: 50, archived: false }, signal),
    select: (data) => data.items,
    staleTime: 30_000,
  })

export function useProjectOverviewQuery() {
  return useQuery(projectOverviewQueryOptions())
}

export const projectDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['projects', 'detail', id],
    queryFn: ({ signal }) => fetchProject(id, signal),
  })

export function useProjectDetailQuery(id: string) {
  return useQuery(projectDetailQueryOptions(id))
}

export const projectUserOptionsQueryOptions = () =>
  queryOptions({
    queryKey: ['projects', 'user-options'],
    queryFn: ({ signal }) =>
      fetchUsers({ page: 1, pageSize: 100, sort: 'name', order: 'asc' }, signal),
    select: (data) =>
      data.items.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        jobTitle: user.jobTitle,
      })),
    staleTime: 5 * 60_000,
  })

export function useProjectUserOptionsQuery() {
  return useQuery(projectUserOptionsQueryOptions())
}
