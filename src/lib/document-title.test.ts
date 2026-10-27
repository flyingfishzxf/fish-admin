import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { APP_NAME, APP_TAGLINE, useDocumentTitle } from '@/lib/document-title'

describe('useDocumentTitle', () => {
  it('prefixes the page title with the app name', () => {
    renderHook(() => useDocumentTitle('Users'))
    expect(document.title).toBe(`Users · ${APP_NAME}`)
  })

  it('falls back to the app name and tagline', () => {
    renderHook(() => useDocumentTitle())
    expect(document.title).toBe(`${APP_NAME} — ${APP_TAGLINE}`)
  })
})
