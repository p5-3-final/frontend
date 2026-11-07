import { describe, expect, it } from "vitest";
import { computeContentRect, toFramePoint } from "./contentRect";

describe("contentRect", () => {
  it("[SPEC-032 R-14] 요소보다 넓은 영상은 위아래 빈 띠를 뺀 영역에 맞춘다", () => {
    expect(computeContentRect({ width: 800, height: 600 }, { width: 1600, height: 900 })).toEqual({
      left: 0,
      top: 75,
      width: 800,
      height: 450,
    });
  });

  it("[SPEC-032 R-14] 요소보다 좁은 영상은 좌우 빈 띠를 뺀 영역에 맞춘다", () => {
    expect(computeContentRect({ width: 1000, height: 450 }, { width: 1600, height: 900 })).toEqual({
      left: 100,
      top: 0,
      width: 800,
      height: 450,
    });
  });

  it("[SPEC-032 R-14] 비율이 같으면 요소 전체가 표시 영역이다", () => {
    expect(computeContentRect({ width: 640, height: 360 }, { width: 1920, height: 1080 })).toEqual({
      left: 0,
      top: 0,
      width: 640,
      height: 360,
    });
  });

  it("[SPEC-032 R-14] 메타데이터 전(영상 크기 0)이면 표시 영역이 없다", () => {
    expect(computeContentRect({ width: 640, height: 360 }, { width: 0, height: 0 })).toBeNull();
  });

  it("[SPEC-032 R-3] 표시 영역 안의 점은 0~1 좌표로, 밖의 점(빈 띠)은 null로 바꾼다", () => {
    const rect = { left: 0, top: 75, width: 800, height: 450 };
    expect(toFramePoint(rect, 400, 300)).toEqual({ x: 0.5, y: 0.5 });
    expect(toFramePoint(rect, 0, 75)).toEqual({ x: 0, y: 0 });
    expect(toFramePoint(rect, 400, 40)).toBeNull();
    expect(toFramePoint(rect, 400, 560)).toBeNull();
  });
});
