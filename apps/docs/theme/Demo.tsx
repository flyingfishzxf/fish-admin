import type { ReactNode } from 'react'

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

export default function Demo({ title, source, filename, children }: DemoProps) {
  const lang = useLang()
  const [theme] = useThemeState()
  const text = uiText(lang)
  const meta = demoFor(filename)
  const component = meta
    ? registry.components.find((entry) => entry.id === meta.component)
    : undefined

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
      <div className="fish-demo__preview">
        <UIProvider locale={lang === 'zh' ? 'zh-CN' : 'en'} theme={theme}>
          {children}
        </UIProvider>
      </div>
      <div className="fish-demo__source">
        <CodeBlockRuntime lang="tsx" code={source} title={filename} />
      </div>
    </section>
  )
}
