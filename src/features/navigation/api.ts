import { apiRequest } from '@/lib/api-client'

export interface MenuRoutePayload {
  titleKey: string
  /** Must name a route this build ships; the resolver drops anything else. */
  path: string
  /** A key of the registry in `menu-icons.ts`. */
  icon: string
  permission?: string
  children?: MenuRoutePayload[]
}

export interface MenuGroupPayload {
  titleKey: string
  items: MenuRoutePayload[]
}

export interface MenuPayload {
  groups: MenuGroupPayload[]
}

export function fetchMenu(signal?: AbortSignal, timeoutMs?: number) {
  return apiRequest<MenuPayload>('/menu', { signal, timeoutMs })
}
