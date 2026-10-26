import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const packageJson = createRequire(import.meta.url)('./package.json') as { version: string }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const mockFlag = env.VITE_ENABLE_MOCK?.trim()
  const mockEnabled = mockFlag ? mockFlag === 'true' : mode === 'development'
  let outDir = resolve('dist')

  return {
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    plugins: [
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      {
        name: 'fish-admin:strip-mock-worker',
        apply: 'build',
        configResolved(config) {
          outDir = resolve(config.root, config.build.outDir)
        },
        closeBundle() {
          // An "API-only" bundle should not carry the MSW worker script either.
          if (mockEnabled) return
          rmSync(resolve(outDir, 'mockServiceWorker.js'), { force: true })
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
    },
    preview: {
      port: 4173,
    },
  }
})
