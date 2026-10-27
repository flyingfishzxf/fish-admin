import { fileURLToPath, URL } from 'node:url'

import type { Alias } from 'vite'

const uiSource = (file: string) =>
  fileURLToPath(new URL(`./packages/ui/src/${file}`, import.meta.url))

// `internal/*` entries must precede the package root, and the exact regexes keep
// `@/` from swallowing `@fish-admin/*`.
export const aliases: Alias[] = [
  {
    find: /^@fish-admin\/react\/internal\/data-table$/,
    replacement: uiSource('internal/data-table.ts'),
  },
  {
    find: /^@fish-admin\/react\/internal\/page-header$/,
    replacement: uiSource('internal/page-header.ts'),
  },
  { find: /^@fish-admin\/react\/internal\/date$/, replacement: uiSource('internal/date.ts') },
  { find: /^@fish-admin\/react\/internal\/tree$/, replacement: uiSource('internal/tree.ts') },
  { find: /^@fish-admin\/react\/internal\/csv$/, replacement: uiSource('internal/csv.ts') },
  { find: /^@fish-admin\/react$/, replacement: uiSource('index.ts') },
  { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
]
