import { describe, expect, it } from "vitest";
import {
  workSessionBody,
  workSessionDetailBody,
  workSessionPageBody,
} from "../../../../mocks/media";
import {
  createSessionFormSchema,
  workSessionDetailSchema,
  workSessionPageSchema,
  workSessionSchema,
} from "./schemas";

describe("작업 세션 스키마", () => {
  it("[SPEC-034 R-1] 계약 예시의 세션 목록을 읽는다", () => {
    expect(workSessionPageSchema.parse(workSessionPageBody()).items[0]?.name).toBe(
      "3번 라인 방호벽 교체",
    );
  });

  it("[SPEC-034 R-2] 계약 예시의 만든 세션을 읽는다", () => {
    expect(workSessionSchema.parse(workSessionBody({ area: null })).area).toBeNull();
  });

  it("[SPEC-034 R-3] 계약 예시의 세션 상세(역할 순 영상)를 읽는다", () => {
    const detail = workSessionDetailSchema.parse(workSessionDetailBody());
    expect(detail.videos.map((video) => video.session?.role)).toEqual(["BEFORE", "AFTER"]);
  });

  it("[SPEC-034 R-2] 세션 이름은 1~100자, 현장·구역은 100자 이하만 받는다", () => {
    expect(createSessionFormSchema.safeParse({ name: "", site: "", area: "" }).success).toBe(false);
    expect(
      createSessionFormSchema.safeParse({ name: "가".repeat(101), site: "", area: "" }).success,
    ).toBe(false);
    expect(
      createSessionFormSchema.safeParse({ name: "교체", site: "가".repeat(101), area: "" }).success,
    ).toBe(false);
    expect(createSessionFormSchema.parse({ name: " 교체 ", site: "", area: "" })).toEqual({
      name: "교체",
      site: "",
      area: "",
    });
  });
});
