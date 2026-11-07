import { describe, expect, it } from "vitest";
import { frameBoxes, mergeOverlayTracks, overlayWindowStart } from "./overlayFrame";

const box = (x: number) => ({ x, y: 0.1, w: 0.1, h: 0.2 });

const person = {
  trackId: "t1",
  className: "person",
  hasEvent: false,
  boxes: [
    { ptsMs: 40000, box: box(0.1) },
    { ptsMs: 40500, box: box(0.2) },
    { ptsMs: 41000, box: box(0.3) },
  ],
};

describe("overlayFrame", () => {
  it("[SPEC-032 R-1] 재생 시각이 든 10초 구간의 시작을 구한다", () => {
    expect(overlayWindowStart(0)).toBe(0);
    expect(overlayWindowStart(9999)).toBe(0);
    expect(overlayWindowStart(10000)).toBe(10000);
    expect(overlayWindowStart(41234)).toBe(40000);
  });

  it("[SPEC-032 R-1] 트랙마다 재생 시각에 가장 가까운 탐지 시각의 박스를 고른다", () => {
    expect(frameBoxes([person], 40300)).toEqual([
      { trackId: "t1", className: "person", hasEvent: false, box: box(0.2) },
    ]);
    expect(frameBoxes([person], 40100)[0]?.box).toEqual(box(0.1));
    expect(frameBoxes([person], 41400)[0]?.box).toEqual(box(0.3));
  });

  it("[SPEC-032 R-1] 가장 가까운 박스가 탐지 간격(500ms)보다 멀면 그리지 않는다", () => {
    expect(frameBoxes([person], 39400)).toEqual([]);
    expect(frameBoxes([person], 41600)).toEqual([]);
  });

  it("[SPEC-032 R-1] 두 구간의 같은 트랙은 박스를 시각 순으로 합친다", () => {
    const next = { ...person, boxes: [{ ptsMs: 50000, box: box(0.9) }] };
    const merged = mergeOverlayTracks([[next], [person]]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.boxes.map((item) => item.ptsMs)).toEqual([40000, 40500, 41000, 50000]);
  });
});
