/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** api-gateway 주소. 예: http://localhost:8080 */
  readonly VITE_API_BASE_URL: string;
  /** 로그인 칸에 미리 채울 로컬 샘플 계정(#14). 로컬 compose 빌드(`.env.compose`)에만 있다. */
  readonly VITE_DEV_LOGIN_EMAIL?: string;
  readonly VITE_DEV_LOGIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
