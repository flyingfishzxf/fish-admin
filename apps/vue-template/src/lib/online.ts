import { onScopeDispose, ref } from 'vue'

/**
 * Tracks `navigator.onLine` the way the React template does: an event listener
 * and nothing else. There is no polling and no ping endpoint, so a captive
 * portal still reads as online — the banner is a hint, not a health check.
 */
export function useOnlineStatus() {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)

  const markOnline = () => {
    online.value = true
  }
  const markOffline = () => {
    online.value = false
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
    onScopeDispose(() => {
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    })
  }

  return online
}
