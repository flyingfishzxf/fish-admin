import { createRequire } from 'node:module'

import { defineConfig } from 'vitest/config'

import { aliases } from './vite.shared.ts'

const packageJson = createRequire(import.meta.url)('./package.json') as { version: string }

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: aliases,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{js,mjs}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts', 'src/config/**/*.ts', 'src/features/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**'],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 65,
        lines: 70,
      },
    },
  },
})
