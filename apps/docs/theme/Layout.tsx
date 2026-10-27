import { useEffect } from 'react'

import { useLang } from '@rspress/core/runtime'
import { Layout as DefaultLayout, type LayoutProps } from '@rspress/core/theme-original'

const ASIDE_LABELS: Record<string, { sidebar: string; outline: string }> = {
  en: { sidebar: 'Sidebar', outline: 'On this page' },
  zh: { sidebar: '侧边栏', outline: '本页目录' },
}

export function Layout(props: LayoutProps) {
  const lang = useLang()
  const labels = ASIDE_LABELS[lang] ?? ASIDE_LABELS.en

  useEffect(() => {
    const decorate = () => {
      for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a.rp-header-anchor')) {
        anchor.tabIndex = -1
      }
      document
        .querySelector('aside.rp-doc-layout__sidebar')
        ?.setAttribute('aria-label', labels.sidebar)
      document
        .querySelector('aside.rp-doc-layout__outline')
        ?.setAttribute('aria-label', labels.outline)
    }
    decorate()
    const observer = new MutationObserver(decorate)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [labels.sidebar, labels.outline])

  return <DefaultLayout {...props} />
}
