import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { env } from './config/env'
import { configureApi } from './lib/api-client'
import { i18nReady } from './lib/i18n'
import { queryClient } from './lib/query-client'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import './styles/index.css'

async function start() {
  await i18nReady

  // Inlined instead of reading `env.enableMock` so the bundler can evaluate the
  // test from literals. An unset flag means a bare clone, where the dev server
  // still gets mocks.
  const mockFlag = import.meta.env.VITE_ENABLE_MOCK
  const mocksEnabled =
    mockFlag === undefined ? import.meta.env.MODE === 'development' : mockFlag === 'true'

  if (mocksEnabled) {
    try {
      const { createMockWorker } = await import('@fish-admin/mock/browser')
      const worker = await createMockWorker({
        apiBaseUrl: env.apiBaseUrl,
        latency: env.mockLatency,
      })
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      })
    } catch (error) {
      console.error('Mock API failed to start', error)
    }
  }

  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()

  configureApi({
    getAccessToken: () => auth.accessToken,
    refreshSession: () => auth.refreshSession(),
    onSessionExpired: () => {
      auth.clearSession()
      queryClient.clear()
      if (router.currentRoute.value.path !== '/login') {
        void router.replace({
          name: 'login',
          query: { redirect: router.currentRoute.value.fullPath },
        })
      }
    },
  })

  useThemeStore().init()
  await auth.bootstrap()

  const app = createApp(App).use(pinia).use(router).use(VueQueryPlugin, { queryClient })
  await router.isReady()
  app.mount('#app')
}

void start()
