import { describe, expect, it } from "vitest";
import type { SourceSummary } from "./schemas";
import { toTimelineMarkers } from "./timelineMarkers";

const item = (
  kind: SourceSummary["timeline"][number]["kind"],
  atMs: number,
  severity: string | null = "medium",
): SourceSummary["timeline"][number] => ({
  atMs,
  kind,
  refId: `ref-${kind}-${String(atMs)}`,
  eventType: "ppe_missing",
  zoneId: null,
  severity,
});

describe("toTimelineMarkers", () => {
  it("[SPEC-031 R-4] 요약 타임라인의 이벤트 항목만 유형·시각·severity 이름과 함께 표시로 만든다", () => {
    const markers = toTimelineMarkers([
      item("event", 95_000, "medium"),
      item("rule_event", 120_000, "high"),
      item("inventory_event", 130_000, null),
      item("risk_activated", 100_000),
      item("risk_resolved", 200_000),
    ]);

    expect(markers).toEqual([
      { id: "ref-event-95000", atMs: 95_000, label: "보호구 미착용 01:35 보통", tone: "medium" },
      {
        id: "ref-rule_event-120000",
        atMs: 120_000,
        label: "보호구 미착용 02:00 높음",
        tone: "high",
      },
      {
        id: "ref-inventory_event-130000",
        atMs: 130_000,
        label: "보호구 미착용 02:10",
        tone: "none",
      },
    ]);
  });
});
