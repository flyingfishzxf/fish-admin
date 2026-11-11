import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import rootPackage from '../../package.json'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(rootPackage.version) },
  server: { port: 4177, strictPort: true },
  preview: { port: 4177, strictPort: true },
})
