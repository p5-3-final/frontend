import { describe, expect, it } from "vitest";
import { niceTicks, xPosition } from "./chartScale";

describe("chartScale", () => {
  it("[SPEC-035 R-15] 최댓값을 덮는 1·2·5 단위 눈금을 0부터 만든다", () => {
    expect(niceTicks(3500)).toEqual([0, 1000, 2000, 3000, 4000]);
    expect(niceTicks(42)).toEqual([0, 10, 20, 30, 40, 50]);
    expect(niceTicks(0.8)).toEqual([0, 0.2, 0.4, 0.6, 0.8]);
  });

  it("[SPEC-035 R-15] 값이 0뿐이면 눈금 하나를 더 둔다", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });

  it("[SPEC-035 R-15] 날짜가 하루뿐이면 가운데 점 하나다", () => {
    expect(xPosition(0, 1, 100)).toBe(50);
    expect(xPosition(0, 3, 100)).toBe(0);
    expect(xPosition(2, 3, 100)).toBe(100);
  });
});
