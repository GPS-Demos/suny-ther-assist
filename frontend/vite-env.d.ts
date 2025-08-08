/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRANSCRIPTION_API: string
  readonly VITE_ANALYSIS_API: string
  readonly VITE_GOOGLE_CLOUD_PROJECT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
