interface StartupCopy {
  title: string
  description: string
  retry: string
}

const COPY: Record<'en' | 'zh-CN', StartupCopy> = {
  en: {
    title: 'Application failed to start',
    description:
      'The admin shell could not be initialized. Reload the page to try again, and check the console if the problem persists.',
    retry: 'Reload page',
  },
  'zh-CN': {
    title: '应用启动失败',
    description: '管理后台未能完成初始化。请重新加载页面重试；若问题持续，请查看控制台了解详情。',
    retry: '重新加载',
  },
}

export interface StartupErrorView {
  root?: HTMLElement | null
  reload?: () => void
  logger?: (error: unknown) => void
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

/**
 * A startup failure happens before Vue is mounted, so there is no app to render
 * an error state. Build the message with plain DOM nodes instead: even if the
 * stylesheet failed to load, native elements keep the failure readable.
 */
export function renderStartupError(error: unknown, view: StartupErrorView = {}): void {
  // An explicit `null` means "no root"; the production default falls back to the
  // body so a missing #app container cannot turn the failure back into a blank page.
  const root =
    view.root === undefined ? (document.getElementById('app') ?? document.body) : view.root
  if (!root) return

  // `setupI18n()` sets `documentElement.lang` synchronously during module import,
  // before `i18nReady` can reject, so the locale is available even on a failed
  // startup. Revisit this coupling if the i18n loading order ever changes.
  const copy = document.documentElement.lang.toLowerCase().startsWith('zh')
    ? COPY['zh-CN']
    : COPY.en
  const reload = view.reload ?? (() => window.location.reload())

  const panel = document.createElement('div')
  panel.setAttribute('role', 'alert')
  panel.className = 'mx-auto flex max-w-lg flex-col gap-3 p-8 text-sm'

  const title = document.createElement('h1')
  title.className = 'text-lg font-semibold'
  title.textContent = copy.title

  const description = document.createElement('p')
  description.textContent = copy.description

  const detail = document.createElement('pre')
  detail.className = 'overflow-auto whitespace-pre-wrap text-xs opacity-70'
  detail.textContent = messageOf(error)

  const retry = document.createElement('button')
  retry.type = 'button'
  retry.className = 'w-fit rounded-md border px-3 py-1.5'
  retry.textContent = copy.retry
  retry.addEventListener('click', reload)

  panel.append(title, description, detail, retry)
  root.replaceChildren(panel)
}

export function handleStartupFailure(error: unknown, view: StartupErrorView = {}): void {
  const logger =
    view.logger ?? ((cause: unknown) => console.error('Application failed to start', cause))
  logger(error)
  renderStartupError(error, view)
}
