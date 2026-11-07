import { describe, expect, it } from "vitest";
import { eventSummaryBody } from "../../../../mocks/analysis";
import { INSPECT_TRACK_ID } from "../../../../mocks/inspect";
import { ppeStatus } from "./ppeStatus";
import { eventSummarySchema } from "./schemas";

const event = (overrides: Parameters<typeof eventSummaryBody>[0] = {}) =>
  eventSummarySchema.parse(eventSummaryBody(overrides));

describe("ppeStatus", () => {
  it("[SPEC-032 R-15] 같은 트랙의 confirmed ppe_missing 이벤트가 있으면 그 이벤트를 보호구 상태로 쓴다", () => {
    const confirmed = event();
    expect(ppeStatus([confirmed], INSPECT_TRACK_ID)).toEqual({ source: "event", event: confirmed });
  });

  it("[SPEC-032 R-15] 다른 트랙·확정되지 않은 판정·다른 유형이면 속성 값을 쓴다", () => {
    const others = [
      event({ trackId: "0192f200-0000-5000-8000-000000000999" }),
      event({ verificationStatus: "unverified" }),
      event({ eventType: "fall" }),
      event({ trackId: null }),
    ];
    expect(ppeStatus(others, INSPECT_TRACK_ID)).toEqual({ source: "attribute" });
  });
});
