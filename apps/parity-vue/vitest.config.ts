import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

import { vueAliases } from '../../vite.vue-shared.ts'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: vueAliases },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
  },
})
