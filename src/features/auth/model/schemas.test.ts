import { describe, expect, it } from "vitest";
import { signUpSchema } from "./schemas";

const VALID = { email: "user@example.com", password: "secret123", nickname: "테스터" };

describe("signUpSchema", () => {
  it("[SPEC-002 R-2] SPEC-001 규칙에 맞는 입력은 통과한다", () => {
    expect(signUpSchema.safeParse(VALID).success).toBe(true);
  });

  it.each([
    ["이메일 형식", { ...VALID, email: "not-an-email" }, "email"],
    ["비밀번호 7자", { ...VALID, password: "abc1234" }, "password"],
    ["비밀번호 65자", { ...VALID, password: `a1${"x".repeat(63)}` }, "password"],
    ["비밀번호에 숫자 없음", { ...VALID, password: "abcdefgh" }, "password"],
    ["비밀번호에 영문 없음", { ...VALID, password: "12345678" }, "password"],
    ["닉네임 1자", { ...VALID, nickname: "가" }, "nickname"],
    ["닉네임 21자", { ...VALID, nickname: "a".repeat(21) }, "nickname"],
    ["닉네임에 특수문자", { ...VALID, nickname: "테스터!" }, "nickname"],
  ])("[SPEC-002 R-2] %s이면 그 칸의 오류로 거절한다", (_, input, field) => {
    const result = signUpSchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([field]);
  });
});
