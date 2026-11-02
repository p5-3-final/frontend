/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** api-gateway 주소. 예: http://localhost:8080 */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
