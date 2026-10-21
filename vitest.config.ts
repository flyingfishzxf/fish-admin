import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
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
