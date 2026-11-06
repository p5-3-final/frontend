import { describe, expect, it } from "vitest";
import { groupMarkers } from "./markers";
import type { TimelineMarker } from "./types";

const marker = (
  id: string,
  atMs: number,
  tone: TimelineMarker["tone"] = "low",
): TimelineMarker => ({
  id,
  atMs,
  label: id,
  tone,
});

describe("groupMarkers", () => {
  it("[SPEC-031 R-4] 시각을 영상 길이에 대한 백분율 위치로 바꾸고 시각 순으로 둔다", () => {
    const groups = groupMarkers([marker("b", 75_000), marker("a", 25_000)], 100_000);
    expect(groups.map((group) => [group.first.id, group.percent])).toEqual([
      ["a", 25],
      ["b", 75],
    ]);
  });

  it("[SPEC-031 R-4] 0.2% 안에 겹친 표시는 하나로 묶고 가장 높은 severity 색과 개수를 갖는다", () => {
    const groups = groupMarkers(
      [marker("a", 10_000, "low"), marker("b", 10_100, "high"), marker("c", 50_000)],
      100_000,
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ count: 2, tone: "high", first: { id: "a" } });
  });

  it("[SPEC-031 R-4] 길이를 모르면 표시하지 않고, 길이를 넘는 시각은 끝에 둔다", () => {
    expect(groupMarkers([marker("a", 1000)], 0)).toEqual([]);
    expect(groupMarkers([marker("a", 120_000)], 100_000)[0]?.percent).toBe(100);
  });
});
