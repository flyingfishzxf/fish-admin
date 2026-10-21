import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'

import { Toaster } from '@/components/ui/sonner'
import i18n from 'i18next'

import { setUnauthorizedHandler } from '@/lib/auth-events'
import { i18nReady } from '@/lib/i18n'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth-store'
import '@fontsource-variable/inter'
import '@/styles/index.css'

import { router } from './router'

async function start() {
  await i18nReady

  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    try {
      const { worker } = await import('./mocks/browser')
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
        },
      })
    } catch (error) {
      console.error('Mock API failed to start', error)
    }
  }

  await useAuthStore.getState().bootstrap()

  setUnauthorizedHandler(() => {
    const { pathname, href } = router.state.location
    if (pathname === '/login') return
    toast.error(i18n.t('errors:api.unauthorized'), { id: 'session-expired' })
    void router.navigate({ to: '/login', search: { redirect: href }, replace: true })
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void start()
