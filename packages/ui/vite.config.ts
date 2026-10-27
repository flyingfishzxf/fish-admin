import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: {
        index: entry('./src/index.ts'),
        'internal/data-table': entry('./src/internal/data-table.ts'),
        'internal/page-header': entry('./src/internal/page-header.ts'),
        'internal/date': entry('./src/internal/date.ts'),
        'internal/tree': entry('./src/internal/tree.ts'),
        'internal/csv': entry('./src/internal/csv.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) =>
        !id.startsWith('.') &&
        !id.startsWith('/') &&
        !id.startsWith('\0') &&
        !/^[A-Za-z]:[\\/]/.test(id),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      },
    },
  },
})
