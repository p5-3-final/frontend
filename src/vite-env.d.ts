/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** api-gateway 주소. 예: http://localhost:8080 */
  readonly VITE_API_BASE_URL: string;
  /** 로그인 칸에 미리 채울 로컬 샘플 계정(#14). 로컬 compose 빌드(`.env.compose`)에만 있다. */
  readonly VITE_DEV_LOGIN_EMAIL?: string;
  readonly VITE_DEV_LOGIN_PASSWORD?: string;
  /** "true"면 analysis·notification·stream을 계약 예시 mock으로 응답한다(개발 전용, SPEC-031). 운영에는 넣지 않는다. */
  readonly VITE_API_MOCKING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
