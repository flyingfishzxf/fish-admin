import { onScopeDispose, ref } from 'vue'

export interface TransientAction {
  label: string
  run: () => void
}

export interface TransientOptions {
  /** A button rendered beside the message — the stand-in for a toast action. */
  action?: TransientAction
  /** Per-call timeout. Undo windows want longer than a "saved" notice. */
  timeout?: number
}

/**
 * Page-local success feedback. The React template uses `sonner` toasts; the Vue
 * template deliberately has no toast library, so pages show a `role="status"`
 * line that clears itself. Keeping the timer here means nine pages cannot drift
 * on the timeout or forget to clear it on unmount.
 */
export function useTransientMessage(timeout = 3000) {
  const message = ref<string | null>(null)
  const action = ref<TransientAction | null>(null)
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
    action.value = null
  }

  function show(text: string, options: TransientOptions = {}) {
    clearTimer()
    message.value = text
    action.value = options.action ?? null
    // The action dies with the message: an undo button that outlives its notice
    // would offer to restore ids the user has since navigated away from.
    timer = setTimeout(() => {
      message.value = null
      action.value = null
      timer = null
    }, options.timeout ?? timeout)
  }

  onScopeDispose(clearTimer)

  return { message, action, show, clear }
}
