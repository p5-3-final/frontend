export const HOME_PATH = "/analysis";

/**
 * 로그인 뒤 돌아갈 주소. 앱 안의 경로만 받는다(SPEC-002 R-7).
 *
 * `//evil.example.com`이나 `https://...`처럼 다른 사이트를 가리키면 로그인 직후 피싱 페이지로 보낼 수 있으므로 무시한다.
 */
export function safeRedirect(value: string | null): string {
  if (
    value === null ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return HOME_PATH;
  }
  return value;
}

/** 지금 주소를 로그인 화면의 redirect 값으로 담은 경로 */
export function logInPathFor(pathname: string, search: string): string {
  return `/login?${new URLSearchParams({ redirect: `${pathname}${search}` }).toString()}`;
}
