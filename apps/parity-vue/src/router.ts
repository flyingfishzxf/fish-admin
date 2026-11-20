import { createRouter, createWebHistory } from 'vue-router'

import ComponentPage from './pages/ComponentPage.vue'
import IndexPage from './pages/IndexPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: IndexPage },
    { path: '/zh', component: IndexPage },
    { path: '/components/:id', component: ComponentPage },
    { path: '/zh/components/:id', component: ComponentPage },
  ],
})
