import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleStartupFailure, renderStartupError } from './startup-error'

function appRoot() {
  const root = document.createElement('div')
  root.id = 'app'
  document.body.replaceChildren(root)
  return root
}

describe('startup error', () => {
  let originalLang: string

  beforeEach(() => {
    originalLang = document.documentElement.lang
    document.documentElement.lang = 'en'
    document.body.replaceChildren()
  })

  afterEach(() => {
    document.documentElement.lang = originalLang
    document.body.replaceChildren()
  })

  it('renders a visible English error with the failure detail', () => {
    const root = appRoot()
    renderStartupError(new Error('i18n namespace failed to load'), { root })

    const alert = root.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Application failed to start')
    expect(alert?.textContent).toContain('i18n namespace failed to load')
    expect(root.querySelector('button')?.textContent).toBe('Reload page')
  })

  it('uses Chinese copy when the document language is zh-CN', () => {
    const root = appRoot()
    document.documentElement.lang = 'zh-CN'
    renderStartupError('bootstrap failed', { root })

    expect(root.textContent).toContain('应用启动失败')
    expect(root.textContent).toContain('bootstrap failed')
    expect(root.querySelector('button')?.textContent).toBe('重新加载')
  })

  it('replaces a previous error and retries on click', () => {
    const root = appRoot()
    const reload = vi.fn()
    renderStartupError(new Error('first'), { root, reload })
    renderStartupError(new Error('second'), { root, reload })

    expect(root.querySelectorAll('[role="alert"]')).toHaveLength(1)
    expect(root.textContent).toContain('second')
    expect(root.textContent).not.toContain('first')
    root.querySelector('button')!.dispatchEvent(new Event('click'))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does nothing when an explicit null root is passed', () => {
    expect(() => renderStartupError(new Error('no root'), { root: null })).not.toThrow()
    expect(document.querySelector('[role="alert"]')).toBeNull()
  })

  it('logs the failure before rendering the panel', () => {
    const root = appRoot()
    const logger = vi.fn(() => {
      expect(root.textContent).toBe('')
    })
    handleStartupFailure(new Error('boom'), { root, logger })

    expect(logger).toHaveBeenCalledWith(expect.any(Error))
    expect(root.textContent).toContain('Application failed to start')
    expect(root.textContent).toContain('boom')
  })

  it('renders non-Error rejections without throwing', () => {
    const root = appRoot()
    renderStartupError({ code: 'STARTUP_FAILED' }, { root })
    expect(root.textContent).toContain('STARTUP_FAILED')
  })

  it('falls back to document.body when #app is missing', () => {
    document.body.replaceChildren()
    handleStartupFailure(new Error('no container'), { logger: vi.fn() })

    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
      'Application failed to start',
    )
  })

  it('logs to console.error when no logger is injected', () => {
    const root = appRoot()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    handleStartupFailure(new Error('boom'), { root })

    expect(error).toHaveBeenCalledWith('Application failed to start', expect.any(Error))
    expect(root.textContent).toContain('Application failed to start')
  })
})
