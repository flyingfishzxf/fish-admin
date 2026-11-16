import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { vueAliases } from '../../vite.vue-shared.ts'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: vueAliases },
  server: { port: 4176, strictPort: true },
  preview: { port: 4176, strictPort: true },
})
