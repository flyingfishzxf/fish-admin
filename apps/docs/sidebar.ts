import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Sidebar } from '@rspress/core'

import registry from './generated/registry.json'

export type DocsLang = 'en' | 'zh'

const root = path.dirname(fileURLToPath(import.meta.url))
const docsRoot = path.join(root, 'docs')

const CATEGORIES = ['primitive', 'enterprise', 'pro'] as const

const CATEGORY_LABELS: Record<DocsLang, Record<(typeof CATEGORIES)[number], string>> = {
  en: { primitive: 'Primitive', enterprise: 'Enterprise', pro: 'Pro' },
  zh: { primitive: '基础组件', enterprise: '企业组件', pro: 'Pro 组件' },
}

const GROUP_LABELS: Record<
  DocsLang,
  { guide: string; components: string; template: string; versions: string }
> = {
  en: { guide: 'Guide', components: 'Components', template: 'Template', versions: 'Versions' },
  zh: { guide: '指南', components: '组件', template: '模板', versions: '版本' },
}

type Page = { text: string; link: string }
type Group = {
  text: string
  link?: string
  collapsible?: boolean
  collapsed?: boolean
  items: Array<Page | Group>
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T
}

function frontmatterTitle(lang: DocsLang, dir: string, slug: string): string {
  for (const extension of ['.mdx', '.md']) {
    const file = path.join(docsRoot, lang, dir, `${slug}${extension}`)
    if (!fs.existsSync(file)) continue
    const match = fs.readFileSync(file, 'utf8').match(/^title:\s*(.+)$/m)
    if (match) return match[1].trim().replace(/^['"]|['"]$/g, '')
  }
  return slug
}

function metaSlugs(lang: DocsLang, dir: string): string[] {
  return readJson<string[]>(path.join(docsRoot, lang, dir, '_meta.json'))
}

function pageItems(lang: DocsLang, dir: string): Page[] {
  return metaSlugs(lang, dir).map((slug) => ({
    text: frontmatterTitle(lang, dir, slug),
    link: `/${dir}/${slug}`,
  }))
}

function nav(lang: DocsLang) {
  const items = readJson<Array<{ text: string; link: string }>>(
    path.join(docsRoot, lang, '_nav.json'),
  )
  return items.map((item) =>
    item.link === '/components' || item.link === '/template'
      ? { ...item, link: `${item.link}/index` }
      : item,
  )
}

export function createNav(lang: DocsLang) {
  return nav(lang)
}

export function createSidebar(lang: DocsLang): Sidebar {
  const prefix = lang === 'zh' ? '/zh' : ''

  const categories: Group[] = CATEGORIES.map((category) => {
    const entries = registry.components.filter((entry) => entry.category === category)
    return {
      text: `${CATEGORY_LABELS[lang][category]} · ${entries.length}`,
      collapsible: true,
      collapsed: true,
      items: entries.map((entry) => ({
        text: frontmatterTitle(lang, 'components', entry.id),
        link: `/components/${entry.id}`,
      })),
    }
  })

  const guide: Group = {
    text: GROUP_LABELS[lang].guide,
    collapsible: true,
    collapsed: true,
    items: pageItems(lang, 'guide'),
  }

  const components: Group = {
    text: GROUP_LABELS[lang].components,
    link: '/components/index',
    collapsible: true,
    collapsed: false,
    items: categories,
  }

  const template: Group = {
    text: GROUP_LABELS[lang].template,
    link: '/template/index',
    collapsible: true,
    collapsed: true,
    items: pageItems(lang, 'template').filter((item) => item.link !== '/template/index'),
  }

  const versions: Page = { text: GROUP_LABELS[lang].versions, link: '/versions' }

  const full: Array<Page | Group> = [guide, components, template, versions]

  return {
    [`${prefix}/guide/`]: full,
    [`${prefix}/components/`]: full,
    [`${prefix}/template/`]: full,
    [`${prefix}/versions`]: full,
  }
}
