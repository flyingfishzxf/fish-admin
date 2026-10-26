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
  /** Attach the session access token and refresh it on a 401. Public endpoints set this to false. */
  auth?: boolean
  /** Explicit bearer for calls made before the session exists, such as `/auth/me` right after login. */
  token?: string
  /** Allow one refresh-and-retry after a 401. Ignored when `auth` is false. */
  retry?: boolean
  /** Overrides `VITE_REQUEST_TIMEOUT` for this call. */
  timeoutMs?: number
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

async function performFetch(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<Response> {
  const {
    method = 'GET',
    body,
    headers: extraHeaders,
    signal,
    timeoutMs = env.requestTimeout,
  } = options
  const timeoutSignal = AbortSignal.timeout(timeoutMs)

  try {
    return await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    // A caller-driven cancellation is a cancellation, not a failure: hand it
    // back untouched so TanStack Query can discard the superseded fetch.
    if (signal?.aborted) throw error

    if (timeoutSignal.aborted) {
      throw new ApiError(0, 'REQUEST_TIMEOUT', `Request to ${path} timed out after ${timeoutMs}ms.`)
    }

    throw new ApiError(0, 'NETWORK_ERROR', `Request to ${path} never reached the API.`)
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, retry = true, token } = options
  const accessToken = token ?? (auth ? useAuthStore.getState().accessToken : null)

  const response = await performFetch(path, options, accessToken)

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
