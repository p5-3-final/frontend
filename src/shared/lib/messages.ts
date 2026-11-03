// SPEC-002 NFR-3: 오류 code마다 정한 문구를 쓰고, 정하지 않은 code에는 공통 문구를 쓴다.
export const GENERIC_ERROR_MESSAGE = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

const INVALID_INPUT_MESSAGE = "입력값을 확인해 주세요.";

// 업로드 전 파일 검사(SPEC-005 R-2, R-3)와 서버 오류에 같은 문구를 쓴다.
export const UNSUPPORTED_FORMAT_MESSAGE = "mp4, mov, mkv, avi 영상만 올릴 수 있습니다.";
export const FILE_SIZE_MESSAGE = "파일 크기는 1바이트 이상 5GB 이하여야 합니다.";
// 저장소 오류는 ProblemDetail이 아니라 code가 없다(SPEC-005 R-10).
export const UPLOAD_CONNECTION_MESSAGE = "업로드 중 연결이 끊겼습니다. 다시 시도해 주세요.";

const MESSAGES: Readonly<Record<string, string>> = {
  AUTH_EMAIL_DUPLICATED: "이미 가입된 이메일입니다.",
  AUTH_INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
  AUTH_ACCOUNT_LOCKED: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  GATEWAY_RATE_LIMITED: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  AUTH_PASSWORD_POLICY: INVALID_INPUT_MESSAGE,
  AUTH_INVALID_REQUEST: INVALID_INPUT_MESSAGE,
  MEDIA_FILE_SIZE_INVALID: FILE_SIZE_MESSAGE,
  MEDIA_UNSUPPORTED_FORMAT: UNSUPPORTED_FORMAT_MESSAGE,
  MEDIA_UPLOAD_INCOMPLETE: "파일이 모두 올라가지 않았습니다. 다시 시도해 주세요.",
  MEDIA_INVALID_STATE: "만료되었거나 삭제된 영상이라 업로드를 마칠 수 없습니다.",
  MEDIA_VIDEO_NOT_FOUND: "이미 삭제되었거나 찾을 수 없는 영상입니다.",
  MEDIA_INVALID_REQUEST: INVALID_INPUT_MESSAGE,
};

/** 오류 code에 맞는 한국어 문구. code가 없거나 모르는 값이면 공통 문구다. */
export function messageForCode(code: string | undefined): string {
  return (code === undefined ? undefined : MESSAGES[code]) ?? GENERIC_ERROR_MESSAGE;
}
