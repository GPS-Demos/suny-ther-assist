/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLOUD_PROJECT: string
  readonly VITE_ANALYSIS_API: string
  readonly VITE_STORAGE_ACCESS_URL: string
  readonly VITE_STREAMING_API: string
  readonly VITE_AUTH_ALLOWED_DOMAINS: string
  readonly VITE_AUTH_ALLOWED_EMAILS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
