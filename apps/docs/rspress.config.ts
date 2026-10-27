import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from '@rspress/core'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.join(root, 'docs'),
  outDir: path.join(root, 'doc_build'),
  title: 'FishAdmin UI',
  description: '83 React components and a production-shaped admin template.',
  lang: 'en',
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'FishAdmin UI',
      description: '83 React components and a production-shaped admin template.',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'FishAdmin UI',
      description: '83 个 React 组件与一套可直接运行的中后台模板。',
    },
  ],
  themeConfig: {
    darkMode: true,
    search: true,
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/flyingfishzxf/fish-admin' },
    ],
    footer: {
      message:
        'MIT Licensed · <a href="https://fish-admin.vercel.app" target="_blank" rel="noreferrer">Live demo</a> · Vue 3 planned',
    },
  },
  globalStyles: path.join(root, 'theme/styles/index.css'),
  markdown: {
    link: { checkDeadLinks: true, checkAnchors: false, autoPrefix: true },
  },
  ssg: true,
  builderConfig: {
    resolve: {
      alias: {
        '@docs': root,
      },
    },
  },
})
