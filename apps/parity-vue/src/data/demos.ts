import type { Component } from 'vue'

import type { DemoEntry, DocsLang } from './types'

interface RawMeta {
  id: string
  component: string
  file: string
  title: Record<DocsLang, string>
  description?: Record<DocsLang, string>
  /** Frozen React line count for mirrored demos; omitted for Vue-native demos. */
  lines?: number
}

const views = import.meta.glob('../demos/**/*.vue', { eager: true }) as Record<
  string,
  { default: Component }
>
const sources = import.meta.glob('../demos/**/*.vue', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>
const metas = import.meta.glob('../demos/*/meta.json', {
  eager: true,
  import: 'default',
}) as Record<string, RawMeta[]>

function viewKey(demoId: string): string {
  // Demo ids look like `<component>/<demo>` and every demo SFC lives at
  // `../demos/<component>/<demo>.vue`.
  const key = `../demos/${demoId}.vue`
  if (!views[key]) throw new Error(`demo ${demoId}: no SFC found at ${key}`)
  return key
}

function build(): DemoEntry[] {
  const entries: DemoEntry[] = []
  // Deterministic order: component directories alphabetically, then the
  // author-controlled order inside each meta.json.
  for (const metaPath of Object.keys(metas).sort()) {
    for (const meta of metas[metaPath]) {
      const key = viewKey(meta.id)
      const source = sources[key]
      const view = views[key]?.default
      if (!source || !view) throw new Error(`demo ${meta.id}: missing SFC or source (${key})`)
      const lines = meta.lines ?? source.trimEnd().split('\n').length
      entries.push({
        id: meta.id,
        componentId: meta.component,
        title: meta.title,
        description: meta.description,
        lines,
        filename: meta.file,
        source,
        view,
      })
    }
  }
  return entries
}

export const DEMOS: DemoEntry[] = build()
