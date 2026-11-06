import { describe, expect, it } from "vitest";
import type { NotificationOf } from "../../notifications";
import { applyAlert, type AlertFeed } from "./alertFeed";

const SESSION = "0192fb00-0000-7000-8000-000000000010";

function alert(
  candidateId: string,
  status: "pending" | "confirmed" | "dismissed",
  description: string | null = null,
): NotificationOf<"alert.raised"> {
  return {
    type: "alert.raised",
    sourceId: SESSION,
    occurredAt: "2026-11-06T10:05:04Z",
    data: {
      candidateId,
      status,
      eventType: "fall",
      severity: "high",
      cameraId: "0192fb00-0000-7000-8000-000000000020",
      description,
    },
  };
}

describe("alertFeed", () => {
  it("[SPEC-031 R-20] 새 알림은 맨 앞에 두고 같은 candidateId는 상태를 바꾼다", () => {
    let feed: AlertFeed = [];
    feed = applyAlert(feed, alert("c1", "pending"));
    feed = applyAlert(feed, alert("c2", "pending"));
    feed = applyAlert(feed, alert("c1", "confirmed", "쓰러짐"));

    expect(feed.map((item) => [item.candidateId, item.status])).toEqual([
      ["c2", "pending"],
      ["c1", "confirmed"],
    ]);
    expect(feed[1]?.description).toBe("쓰러짐");
  });

  it("[SPEC-031 R-20] 결정(confirmed·dismissed)이 먼저 오면 뒤에 온 pending은 버린다", () => {
    let feed: AlertFeed = [];
    feed = applyAlert(feed, alert("c1", "dismissed"));
    feed = applyAlert(feed, alert("c1", "pending"));
    expect(feed).toHaveLength(1);
    expect(feed[0]?.status).toBe("dismissed");
  });
});
