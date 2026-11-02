import { useId, useState, type KeyboardEvent } from 'react'

import { editorText } from './copy'

type ExportTab = 'css' | 'json' | 'url'

export default function ExportPanel({
  lang,
  css,
  json,
  shareUrl,
}: {
  lang: 'en' | 'zh'
  css: string
  json: string
  shareUrl: string
}) {
  const text = editorText(lang)
  const id = useId()
  const [tab, setTab] = useState<ExportTab>('css')
  const [copied, setCopied] = useState(false)
  const values: Record<ExportTab, string> = { css, json, url: shareUrl || '—' }
  const labels: Record<ExportTab, string> = {
    css: text.exportCss,
    json: text.exportJson,
    url: text.exportUrl,
  }
  const tabs: ExportTab[] = ['css', 'json', 'url']

  const select = (next: ExportTab) => {
    setTab(next)
    document.getElementById(`${id}-${next}-tab`)?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = tabs.indexOf(tab)
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length
    select(tabs[next])
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(values[tab])
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="fish-export" aria-labelledby={`${id}-title`}>
      <div className="fish-export__head">
        <h3 id={`${id}-title`}>{text.exportTitle}</h3>
        <p>{text.exportHint}</p>
      </div>
      <div className="fish-export__card">
        <div className="fish-export__toolbar">
          <div className="fish-export__tabs" role="tablist" aria-label={text.exportTitle}>
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                id={`${id}-${item}-tab`}
                aria-selected={tab === item}
                aria-controls={`${id}-panel`}
                tabIndex={tab === item ? 0 : -1}
                className="fish-export__tab"
                onClick={() => select(item)}
                onKeyDown={onKeyDown}
              >
                {labels[item]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="fish-export__copy"
            data-copied={copied || undefined}
            onClick={onCopy}
          >
            {copied ? text.copied : text.copy}
          </button>
        </div>
        <pre
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-${tab}-tab`}
          tabIndex={0}
          className="fish-export__code"
        >
          {values[tab]}
        </pre>
        <span className="fish-visually-hidden" role="status">
          {copied ? text.copied : ''}
        </span>
      </div>
    </section>
  )
}
