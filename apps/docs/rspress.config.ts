import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from '@rspress/core'

import { createNav, createSidebar } from './sidebar'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.join(root, 'docs'),
  outDir: path.join(root, 'doc_build'),
  title: 'FishAdmin UI',
  description: '83 React components and a production-shaped admin template.',
  lang: 'en',
  logo: '/logo.svg',
  logoText: 'FishAdmin UI',
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
    footer: {
      message:
        'MIT Licensed · <a href="https://fish-admin.vercel.app" target="_blank" rel="noreferrer">Live demo</a> · <a href="https://github.com/flyingfishzxf/fish-admin" target="_blank" rel="noreferrer">GitHub</a> · Vue 3 planned',
    },
    locales: [
      {
        lang: 'en',
        label: 'English',
        nav: createNav('en'),
        sidebar: createSidebar('en'),
      },
      {
        lang: 'zh',
        label: '简体中文',
        nav: createNav('zh'),
        sidebar: createSidebar('zh'),
      },
    ],
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
