import { BookOpen } from 'lucide-react'

import { env } from '@/config/env'
import type { ExternalNavItem } from '@/config/nav'

/**
 * The retired in-app catalog routes, mapped onto the docs site pages that
 * replaced them. Kept for one release so links from old READMEs and issues land
 * somewhere useful; delete the map when that grace period ends.
 */
const LEGACY_DOCS_PATHS: Readonly<Record<string, string>> = {
  '/components': '/components',
  '/ui': '/guide/theming',
}

export function docsNavItem(): ExternalNavItem | undefined {
  if (!env.docsUrl) return undefined
  return { titleKey: 'nav:items.docs', href: env.docsUrl, icon: BookOpen, external: true }
}

export function docsUrlFor(pathname: string): string | undefined {
  const target = LEGACY_DOCS_PATHS[pathname]
  if (!target || !env.docsUrl) return undefined
  return `${env.docsUrl}${target}`
}
