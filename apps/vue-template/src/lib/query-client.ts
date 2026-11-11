import { QueryClient } from '@tanstack/vue-query'

import { ApiError } from './api-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false
        // Status 0 is client-side: the request never landed or timed out. Both are transient.
        if (error instanceof ApiError) return error.status >= 500 || error.status === 0
        return true
      },
    },
    mutations: {
      retry: false,
    },
  },
})
