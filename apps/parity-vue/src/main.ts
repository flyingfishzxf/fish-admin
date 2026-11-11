import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import './styles/index.css'

// The parity helper seeds this key; the docs host reacts to the same storage contract.
if (window.localStorage.getItem('rspress-theme-appearance') === 'dark') {
  document.documentElement.classList.add('dark', 'rp-dark')
}

createApp(App).use(router).mount('#app')
