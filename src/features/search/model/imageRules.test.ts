import { describe, expect, it } from "vitest";
import { checkSearchImage, MAX_IMAGE_BYTES } from "./imageRules";

const fileOf = (type: string, size: number) => ({ type, size });

describe("이미지 검색 파일 검사", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])(
    "[SPEC-033 R-8] %s 5MB 이하는 받는다",
    (type) => {
      expect(checkSearchImage(fileOf(type, MAX_IMAGE_BYTES))).toBeUndefined();
    },
  );

  it("[SPEC-033 R-8] 5MB(5,242,880바이트)를 넘으면 거절한다", () => {
    expect(MAX_IMAGE_BYTES).toBe(5_242_880);
    expect(checkSearchImage(fileOf("image/jpeg", MAX_IMAGE_BYTES + 1))).toBe(
      "jpg, png, webp 이미지를 5MB 이하로 올려 주세요.",
    );
  });

  it("[SPEC-033 R-8] 다른 형식이나 빈 파일은 거절한다", () => {
    expect(checkSearchImage(fileOf("image/gif", 10))).toBeDefined();
    expect(checkSearchImage(fileOf("", 10))).toBeDefined();
    expect(checkSearchImage(fileOf("image/png", 0))).toBeDefined();
  });
});
