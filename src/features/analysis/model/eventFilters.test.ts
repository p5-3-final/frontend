import { describe, expect, it } from "vitest";
import { parseEventQuery, toEventSearchParams } from "./eventFilters";

describe("eventFilters", () => {
  it("[SPEC-031 R-3] URL 쿼리의 거르기 값을 읽고 모르는 값은 버린다", () => {
    const params = new URLSearchParams(
      "type=fall&severity=extreme&verification=unknown&review=DISMISSED&event=x",
    );
    expect(parseEventQuery(params)).toEqual({
      eventType: "fall",
      verificationStatus: "unknown",
      reviewState: "DISMISSED",
    });
  });

  it("[SPEC-031 R-3] 거르기 값을 URL 쿼리로 바꾸고 고르지 않은 값은 지우며 다른 쿼리는 둔다", () => {
    const next = toEventSearchParams(new URLSearchParams("event=e1&type=fall&t=10"), {
      severity: "high",
    });
    expect(next.toString()).toBe("event=e1&t=10&severity=high");
  });
});
