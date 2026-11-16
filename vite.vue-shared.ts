import { fileURLToPath, URL } from 'node:url'

import type { Alias } from 'vite'

// Same contract as `vite.shared.ts`: during development the Vue apps compile the
// package source directly, while the published package points at `dist`.
export const vueAliases: Alias[] = [
  {
    find: /^@fish-admin\/vue$/,
    replacement: fileURLToPath(new URL('./packages/vue/src/index.ts', import.meta.url)),
  },
]
