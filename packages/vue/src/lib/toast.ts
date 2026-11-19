import { reactive, readonly } from 'vue'

export type ToastTone = 'default' | 'success' | 'info' | 'warning' | 'error' | 'loading'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  /** Target Toaster when more than one is mounted. */
  toasterId?: string
  description?: string
  /** Milliseconds before auto-dismiss; 0 keeps the toast until dismissed. */
  duration?: number
  action?: ToastAction
}

export interface ToastRecord extends ToastOptions {
  id: number
  message: string
  tone: ToastTone
}

interface ToastStore {
  records: ToastRecord[]
}

// One module-level store: every toast() call reaches every Toaster.
const stores = new Map<string, ReturnType<typeof reactive<ToastStore>>>()
const DEFAULT_ID = 'default'

function storeFor(id = DEFAULT_ID) {
  if (!stores.has(id)) stores.set(id, reactive<ToastStore>({ records: [] }))
  return stores.get(id)!
}

export const toastStores = readonly(stores)
export function observeToaster(id = DEFAULT_ID) {
  return storeFor(id)
}

let nextId = 1

function push(tone: ToastTone, message: string, options?: ToastOptions | string) {
  const opts: ToastOptions =
    typeof options === 'string' ? { description: options } : (options ?? {})
  const id = nextId++
  const store = storeFor(opts.toasterId)
  store.records.push({ id, message, tone, ...opts })
  const duration = opts.duration ?? 4000
  if (duration > 0) setTimeout(() => dismiss(id, opts.toasterId), duration)
  return id
}

function dismiss(id?: number, toasterId = DEFAULT_ID) {
  const store = storeFor(toasterId)
  if (id === undefined) store.records.splice(0)
  else {
    const index = store.records.findIndex((record) => record.id === id)
    if (index >= 0) store.records.splice(index, 1)
  }
}

export const toast = Object.assign(
  (message: string, options?: ToastOptions | string) => push('default', message, options),
  {
    success: (message: string, options?: ToastOptions | string) =>
      push('success', message, options),
    info: (message: string, options?: ToastOptions | string) => push('info', message, options),
    warning: (message: string, options?: ToastOptions | string) =>
      push('warning', message, options),
    error: (message: string, options?: ToastOptions | string) => push('error', message, options),
    loading: (message: string, options?: ToastOptions | string) =>
      push('loading', message, options),
    dismiss,
  },
)
