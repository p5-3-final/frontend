// SPEC-002 NFR-3: 오류 code마다 정한 문구를 쓰고, 정하지 않은 code에는 공통 문구를 쓴다.
export const GENERIC_ERROR_MESSAGE = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

const INVALID_INPUT_MESSAGE = "입력값을 확인해 주세요.";

const MESSAGES: Readonly<Record<string, string>> = {
  AUTH_EMAIL_DUPLICATED: "이미 가입된 이메일입니다.",
  AUTH_INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
  AUTH_ACCOUNT_LOCKED: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  GATEWAY_RATE_LIMITED: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  AUTH_PASSWORD_POLICY: INVALID_INPUT_MESSAGE,
  AUTH_INVALID_REQUEST: INVALID_INPUT_MESSAGE,
};

/** 오류 code에 맞는 한국어 문구. code가 없거나 모르는 값이면 공통 문구다. */
export function messageForCode(code: string | undefined): string {
  return (code === undefined ? undefined : MESSAGES[code]) ?? GENERIC_ERROR_MESSAGE;
}
