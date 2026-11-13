import { onScopeDispose, ref } from 'vue'

/**
 * Page-local success feedback. The React template uses `sonner` toasts; the Vue
 * template deliberately has no toast library, so pages show a `role="status"`
 * line that clears itself. Keeping the timer here means nine pages cannot drift
 * on the timeout or forget to clear it on unmount.
 */
export function useTransientMessage(timeout = 3000) {
  const message = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function clear() {
    clearTimer()
    message.value = null
  }

  function show(text: string) {
    clearTimer()
    message.value = text
    timer = setTimeout(() => {
      message.value = null
      timer = null
    }, timeout)
  }

  onScopeDispose(clearTimer)

  return { message, show, clear }
}
