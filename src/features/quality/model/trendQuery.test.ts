import { describe, expect, it } from "vitest";
import { MAX_PERIOD_DAYS, periodError } from "./trendQuery";

describe("periodError", () => {
  it("[SPEC-035 R-15] 90일까지는 받아들이고 넘으면 이유를 돌려준다", () => {
    expect(MAX_PERIOD_DAYS).toBe(90);
    expect(periodError("2026-08-09", "2026-11-07")).toBeNull();
    expect(periodError("2026-08-08", "2026-11-07")).toBe("기간은 90일까지 조회할 수 있습니다.");
  });

  it("[SPEC-035 R-15] 날짜가 비었거나 끝이 시작보다 앞이면 거절한다", () => {
    expect(periodError("", "2026-11-07")).toBe("시작일과 종료일을 넣어 주세요.");
    expect(periodError("2026-11-07", "2026-11-01")).toBe("종료일은 시작일과 같거나 뒤여야 합니다.");
    expect(periodError("2026-11-07", "2026-11-07")).toBeNull();
  });
});
