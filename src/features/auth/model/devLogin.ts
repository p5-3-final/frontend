import type { LogInValues } from "./schemas";

/**
 * 로컬 compose에서 로그인 칸에 미리 채울 샘플 계정(#14).
 * 값은 빌드 모드 compose일 때 읽는 `.env.compose`에만 있고, 배포 빌드와 `pnpm dev`에는 없어 `undefined`다.
 * 테스트가 환경변수를 바꿀 수 있도록 모듈을 불러올 때가 아니라 부를 때 읽는다.
 */
export function readDevLogin(): LogInValues | undefined {
  const email = import.meta.env.VITE_DEV_LOGIN_EMAIL;
  const password = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
  if (!email || !password) {
    return undefined;
  }
  return { email, password };
}
