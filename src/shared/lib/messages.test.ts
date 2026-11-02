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

  it("[SPEC-002 NFR-3] 정하지 않은 code나 code가 없으면 공통 문구를 쓴다", () => {
    expect(messageForCode("SOMETHING_NEW")).toBe(GENERIC_ERROR_MESSAGE);
    expect(messageForCode(undefined)).toBe(GENERIC_ERROR_MESSAGE);
  });
});
