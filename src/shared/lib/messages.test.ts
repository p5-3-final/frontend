import { describe, expect, it } from "vitest";
import { GENERIC_ERROR_MESSAGE, messageForCode } from "./messages";

describe("messageForCode", () => {
  it.each([
    ["AUTH_EMAIL_DUPLICATED", "이미 가입된 이메일입니다."],
    ["AUTH_INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다."],
    ["AUTH_ACCOUNT_LOCKED", "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."],
    ["GATEWAY_RATE_LIMITED", "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."],
    ["AUTH_PASSWORD_POLICY", "입력값을 확인해 주세요."],
    ["AUTH_INVALID_REQUEST", "입력값을 확인해 주세요."],
  ])("[SPEC-002 NFR-3] %s에는 정한 문구를 쓴다", (code, message) => {
    expect(messageForCode(code)).toBe(message);
  });

  it.each([
    ["MEDIA_FILE_SIZE_INVALID", "파일 크기는 1바이트 이상 5GB 이하여야 합니다."],
    ["MEDIA_UNSUPPORTED_FORMAT", "mp4, mov, mkv, avi 영상만 올릴 수 있습니다."],
    ["MEDIA_UPLOAD_INCOMPLETE", "파일이 모두 올라가지 않았습니다. 다시 시도해 주세요."],
    ["MEDIA_INVALID_STATE", "만료되었거나 삭제된 영상이라 업로드를 마칠 수 없습니다."],
    ["MEDIA_VIDEO_NOT_FOUND", "이미 삭제되었거나 찾을 수 없는 영상입니다."],
    ["MEDIA_INVALID_REQUEST", "입력값을 확인해 주세요."],
  ])("[SPEC-005 NFR-3] %s에는 정한 문구를 쓴다", (code, message) => {
    expect(messageForCode(code)).toBe(message);
  });

  it.each([
    ["ANALYSIS_SOURCE_NOT_FOUND", "영상을 찾을 수 없습니다."],
    ["ANALYSIS_EVENT_NOT_FOUND", "이벤트를 찾을 수 없습니다."],
    ["ANALYSIS_FORBIDDEN", "운영자만 이벤트를 확인·기각할 수 있습니다."],
    ["ANALYSIS_UNAVAILABLE", "분석 결과를 잠시 불러올 수 없습니다. 다시 시도해 주세요."],
  ])("[SPEC-031 R-17] %s에는 정한 문구를 쓴다", (code, message) => {
    expect(messageForCode(code)).toBe(message);
  });

  it("[SPEC-006 R-9] MEDIA_NOT_PLAYABLE에는 재생할 수 없는 이유를 쓴다", () => {
    expect(messageForCode("MEDIA_NOT_PLAYABLE")).toBe(
      "업로드가 끝나지 않았거나 만료된 영상이라 재생할 수 없습니다.",
    );
  });

  it("[SPEC-002 NFR-3] 정하지 않은 code나 code가 없으면 공통 문구를 쓴다", () => {
    expect(messageForCode("SOMETHING_NEW")).toBe(GENERIC_ERROR_MESSAGE);
    expect(messageForCode(undefined)).toBe(GENERIC_ERROR_MESSAGE);
  });
});
