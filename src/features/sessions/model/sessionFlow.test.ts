import { describe, expect, it } from "vitest";
import { eventSummaryBody, riskBody } from "../../../../mocks/analysis";
import { sessionVideoBody } from "../../../../mocks/media";
import { buildSessionFlow } from "./sessionFlow";

const before = sessionVideoBody("BEFORE");
const after = sessionVideoBody("AFTER");
const event = eventSummaryBody;
const risk = riskBody;

describe("buildSessionFlow", () => {
  it("[SPEC-034 R-4] 이어 온 위험과 방호 미복구·물건 제거·이동 이벤트만 고른다", () => {
    const flow = buildSessionFlow([
      {
        video: before,
        events: [
          event({ eventId: "e-ppe", eventType: "ppe_missing" }),
          event({ eventId: "e-removed", eventType: "object_removed", startMs: 5000 }),
        ],
        risks: [risk({ riskId: "r-new", carriedOver: false })],
      },
      {
        video: after,
        events: [event({ eventId: "e-barrier", eventType: "barrier_not_restored", startMs: 9000 })],
        risks: [risk({ riskId: "r-carried", carriedOver: true, firstSeenMs: 0 })],
      },
    ]);

    expect(flow.map((item) => item.id)).toEqual(["e-removed", "r-carried", "e-barrier"]);
  });

  it("[SPEC-034 R-4] 영상 순서(역할 순)를 먼저, 같은 영상 안에서는 시각 순으로 놓는다", () => {
    const flow = buildSessionFlow([
      {
        video: before,
        events: [
          event({ eventId: "b-late", eventType: "object_moved", startMs: 70000 }),
          event({ eventId: "b-early", eventType: "object_removed", startMs: 1000 }),
        ],
        risks: [],
      },
      {
        video: after,
        events: [event({ eventId: "a-1", eventType: "barrier_not_restored", startMs: 500 })],
        risks: [risk({ riskId: "a-risk", carriedOver: true, firstSeenMs: 200 })],
      },
    ]);

    expect(flow.map((item) => item.id)).toEqual(["b-early", "b-late", "a-risk", "a-1"]);
    expect(flow[2]).toMatchObject({ kind: "risk", videoId: after.id, atMs: 200 });
  });

  it("[SPEC-034 R-4] 아직 받지 못한 영상은 건너뛴다", () => {
    expect(buildSessionFlow([{ video: before, events: undefined, risks: undefined }])).toEqual([]);
  });
});
