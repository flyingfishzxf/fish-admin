import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'

import { UIProvider } from '@fish-admin/react'
import { useLang } from '@rspress/core/runtime'
import { CodeBlockRuntime, useThemeState } from '@rspress/core/theme'

import { demoFor } from '@docs/demos/registry'
import registry from '@docs/generated/registry.json'
import { SITE, demoSourceUrl, templatePath, uiText } from '@docs/site'

export interface DemoProps {
  title: string
  source: string
  filename: string
  children: ReactNode
}

type DemoView = 'preview' | 'code'

export default function Demo({ title, source, filename, children }: DemoProps) {
  const lang = useLang()
  const [theme] = useThemeState()
  const text = uiText(lang)
  const [view, setView] = useState<DemoView>('preview')
  const [copied, setCopied] = useState(false)
  const id = useId()
  const meta = demoFor(filename)
  const component = meta
    ? registry.components.find((entry) => entry.id === meta.component)
    : undefined
  const lineCount = source.trimEnd().split('\n').length

  const select = (next: DemoView) => {
    setView(next)
    document.getElementById(`${id}-${next}-tab`)?.focus()
  }

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    select(view === 'preview' ? 'code' : 'preview')
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="fish-demo" data-demo={meta?.id ?? filename}>
      <header className="fish-demo__header">
        <h3 className="fish-demo__title">{title}</h3>
        <div className="fish-demo__links">
          {component ? (
            <a
              href={`${SITE.demoUrl}${templatePath(component.usedIn)}`}
              target="_blank"
              rel="noreferrer"
            >
              {text.demoUsedIn}
            </a>
          ) : null}
          <a href={demoSourceUrl(filename)} target="_blank" rel="noreferrer">
            {text.demoViewSource}
          </a>
        </div>
      </header>
      <div className="fish-demo__card">
        <div className="fish-demo__toolbar">
          <div className="fish-demo__tabs" role="tablist" aria-label={title}>
            <button
              type="button"
              role="tab"
              id={`${id}-preview-tab`}
              aria-selected={view === 'preview'}
              aria-controls={`${id}-preview`}
              tabIndex={view === 'preview' ? 0 : -1}
              className="fish-demo__tab"
              onClick={() => select('preview')}
              onKeyDown={onTabKeyDown}
            >
              {text.demoPreview}
            </button>
            <button
              type="button"
              role="tab"
              id={`${id}-code-tab`}
              aria-selected={view === 'code'}
              aria-controls={`${id}-code`}
              tabIndex={view === 'code' ? 0 : -1}
              className="fish-demo__tab"
              onClick={() => select('code')}
              onKeyDown={onTabKeyDown}
            >
              {text.demoSource}
            </button>
          </div>
          <div className="fish-demo__tools">
            <span className="fish-demo__meta">
              TSX · {lineCount} {text.demoLines}
            </span>
            <button
              type="button"
              className="fish-demo__copy"
              aria-label={text.demoCopy}
              title={copied ? text.demoCopied : text.demoCopy}
              data-copied={copied || undefined}
              onClick={onCopy}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
                <path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1" />
              </svg>
            </button>
            <span className="fish-visually-hidden" role="status">
              {copied ? text.demoCopied : ''}
            </span>
          </div>
        </div>
        <div
          id={`${id}-preview`}
          role="tabpanel"
          aria-labelledby={`${id}-preview-tab`}
          hidden={view !== 'preview'}
          className="fish-demo__panel fish-demo__preview"
        >
          <UIProvider locale={lang === 'zh' ? 'zh-CN' : 'en'} theme={theme}>
            {children}
          </UIProvider>
        </div>
        <div
          id={`${id}-code`}
          role="tabpanel"
          aria-labelledby={`${id}-code-tab`}
          hidden={view !== 'code'}
          className="fish-demo__panel fish-demo__source"
        >
          <CodeBlockRuntime lang="tsx" code={source} title={filename} />
        </div>
      </div>
    </section>
  )
}
