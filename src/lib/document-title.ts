import { useEffect } from 'react'

export const APP_NAME = 'FishAdmin'
export const APP_TAGLINE = 'Modern Admin Dashboard Starter'

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} — ${APP_TAGLINE}`
  }, [title])
}
