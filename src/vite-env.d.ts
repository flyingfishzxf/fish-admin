/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCK?: string
  readonly VITE_MOCK_LATENCY?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_REQUEST_TIMEOUT?: string
  readonly VITE_UPLOAD_TIMEOUT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
