import type { Component } from 'vue'

export type DocsLang = 'en' | 'zh'

export interface ComponentEntry {
  id: string
  name: string
  category: 'primitive' | 'enterprise' | 'pro'
  status: 'stable' | 'beta'
  since: string
  usedIn: string
  isNew: boolean
}

export interface DemoEntry {
  id: string
  componentId: string
  title: Record<DocsLang, string>
  /** Frozen React source line count; the toolbar must keep showing it verbatim. */
  lines: number
  /** Original docs path, used only for the "View source" link. */
  filename: string
  /** Raw Vue SFC text, displayed in the Code tab. */
  source: string
  view: Component
}
