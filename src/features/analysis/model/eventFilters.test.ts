import { describe, expect, it } from "vitest";
import { eventSummaryBody } from "../../../../mocks/analysis";
import { countBudgetSkipped, parseEventQuery, toEventSearchParams } from "./eventFilters";
import { eventSummarySchema } from "./schemas";

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

  it("[SPEC-031 R-23] 예산·상한 초과로 판정하지 않은 이벤트만 센다", () => {
    const events = [
      { verificationStatus: "unverified", unverifiedReason: "budget_exceeded" },
      { verificationStatus: "unverified", unverifiedReason: "call_cap_reached" },
      { verificationStatus: "unverified", unverifiedReason: "model_unavailable" },
      { verificationStatus: "unverified" },
      { verificationStatus: "confirmed" },
    ] as const;
    expect(
      countBudgetSkipped(events.map((event) => eventSummarySchema.parse(eventSummaryBody(event)))),
    ).toBe(2);
  });
});
