import { env } from '@/config/env'
import { ApiError } from '@/lib/api-error'
import { notifyUnauthorized } from '@/lib/auth-events'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth-store'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  auth?: boolean
  retry?: boolean
}

async function parseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    code?: string
    message?: string
  } | null

  return new ApiError(
    response.status,
    payload?.code ?? 'REQUEST_FAILED',
    payload?.message ?? response.statusText,
  )
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers: extraHeaders, signal, auth = true, retry = true } = options
  const accessToken = auth ? useAuthStore.getState().accessToken : null

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    signal,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401 && auth) {
    if (retry) {
      const refreshed = await useAuthStore.getState().refreshSession()
      if (refreshed) {
        return apiRequest<T>(path, { ...options, retry: false })
      }
    }

    useAuthStore.getState().clearSession()
    queryClient.clear()
    notifyUnauthorized()
    throw await parseError(response)
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
