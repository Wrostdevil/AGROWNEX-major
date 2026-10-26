/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Agrownex Express API (see backend/.env.example). */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
