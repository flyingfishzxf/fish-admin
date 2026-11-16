import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { vueAliases } from '../../vite.vue-shared.ts'

import rootPackage from '../../package.json'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: vueAliases },
  define: { __APP_VERSION__: JSON.stringify(rootPackage.version) },
  server: { port: 4177, strictPort: true },
  preview: { port: 4177, strictPort: true },
})
