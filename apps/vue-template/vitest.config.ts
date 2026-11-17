import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

import rootPackage from '../../package.json' with { type: 'json' }

import { vueAliases } from '../../vite.vue-shared.ts'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: vueAliases },
  // Mirrors vite.config.ts so components that print the version render in jsdom.
  define: { __APP_VERSION__: JSON.stringify(rootPackage.version) },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
  },
})
