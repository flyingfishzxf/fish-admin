import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import './styles/index.css'

// The parity helper seeds this key; the docs host reacts to the same storage contract.
if (window.localStorage.getItem('rspress-theme-appearance') === 'dark') {
  document.documentElement.classList.add('dark', 'rp-dark')
}

router.afterEach((to) => {
  const zh = to.path.startsWith('/zh')
  document.documentElement.lang = zh ? 'zh-CN' : 'en'
  const id = typeof to.params.id === 'string' ? to.params.id : ''
  document.title = id
    ? `${id} · FishAdmin Vue`
    : zh
      ? 'FishAdmin Vue — 90 个 Vue 3 组件'
      : 'FishAdmin Vue — 90 Vue 3 components'
})

createApp(App).use(router).mount('#app')
