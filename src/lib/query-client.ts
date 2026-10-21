import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false
        if (error instanceof ApiError) return error.status >= 500
        return true
      },
    },
    mutations: {
      retry: false,
    },
  },
})
