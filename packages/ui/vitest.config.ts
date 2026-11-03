import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/components/**/*.{ts,tsx}', 'src/lib/**/*.ts'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/components/**/index.ts'],
      thresholds: {
        // Floor = final M2 actual minus 5 percentage points; raise as coverage grows.
        statements: 77,
        branches: 68,
        functions: 78,
        lines: 79,
      },
    },
  },
})
