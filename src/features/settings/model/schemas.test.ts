import { describe, expect, it } from "vitest";
import { retainedVideoPageBody } from "../../../../mocks/media";
import { retainedVideoPageSchema, retentionSettingsSchema } from "./schemas";

describe("학습용 보존 스키마", () => {
  it("[SPEC-034 R-9] 계약 예시의 보존 기본값을 읽는다", () => {
    expect(retentionSettingsSchema.parse({ defaultConsent: true }).defaultConsent).toBe(true);
  });

  it("[SPEC-034 R-10] 계약 예시의 보존 중인 삭제 영상 목록을 읽는다", () => {
    expect(retainedVideoPageSchema.parse(retainedVideoPageBody()).items[0]?.retainUntil).toBe(
      "2027-11-06T09:00:00Z",
    );
  });
});
