import { createRouter, createWebHistory } from 'vue-router'

import ComponentPage from './pages/ComponentPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/components/accordion' },
    { path: '/components/:id', component: ComponentPage },
    { path: '/zh/components/:id', component: ComponentPage },
  ],
})
