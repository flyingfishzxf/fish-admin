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
  /** True when the component only exists in the Vue package. */
  vueOnly?: boolean
}

export interface DemoEntry {
  id: string
  componentId: string
  title: Record<DocsLang, string>
  description?: Record<DocsLang, string>
  /**
   * For demos mirrored from the React docs this stays the frozen React line
   * count and `.tsx` path; for Vue-native demos it is the `.vue` path with the
   * actual source line count.
   */
  lines: number
  /** Path shown next to the "View source" link. */
  filename: string
  /** Raw Vue SFC text, displayed in the Code tab. */
  source: string
  view: Component
}
