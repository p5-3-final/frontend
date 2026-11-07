import { describe, expect, it } from "vitest";
import { zoneViolations } from "./zoneRules";

const square = [
  { x: 0.1, y: 0.1 },
  { x: 0.4, y: 0.1 },
  { x: 0.4, y: 0.4 },
  { x: 0.1, y: 0.4 },
];

function zone(name: string, polygon = square) {
  return { name, polygon };
}

function regular(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count;
    return { x: 0.5 + 0.4 * Math.cos(angle), y: 0.5 + 0.4 * Math.sin(angle) };
  });
}

describe("zoneViolations", () => {
  it("[SPEC-032 R-11] 사각형 구역 하나는 저장할 수 있다", () => {
    expect(zoneViolations([zone("A동")])).toEqual([]);
  });

  it("[SPEC-032 R-11] 꼭짓점이 3개보다 적거나 32개보다 많으면 이유를 돌려준다", () => {
    expect(zoneViolations([zone("A동", square.slice(0, 2))])).toEqual([
      "A동: 꼭짓점이 3개 이상이어야 합니다.",
    ]);
    expect(zoneViolations([zone("A동", regular(3))])).toEqual([]);
    expect(zoneViolations([zone("A동", regular(32))])).toEqual([]);
    expect(zoneViolations([zone("A동", regular(33))])).toEqual([
      "A동: 꼭짓점은 32개까지 둘 수 있습니다.",
    ]);
  });

  it("[SPEC-032 R-11] 변이 서로 교차하는 나비 모양이면 이유를 돌려준다", () => {
    const bowtie = [
      { x: 0.1, y: 0.1 },
      { x: 0.4, y: 0.4 },
      { x: 0.4, y: 0.1 },
      { x: 0.1, y: 0.4 },
    ];
    expect(zoneViolations([zone("A동", bowtie)])).toEqual(["A동: 변이 서로 교차합니다."]);
  });

  it("[SPEC-032 R-11] 꼭짓점이 이웃하지 않은 변에 맞닿거나 넓이가 없으면 교차로 본다", () => {
    const touching = [
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.1 },
      { x: 0.3, y: 0.3 },
      { x: 0.3, y: 0.1 },
      { x: 0.2, y: 0.4 },
    ];
    const flat = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.1 },
      { x: 0.3, y: 0.1 },
    ];
    expect(zoneViolations([zone("A동", touching)])).toEqual(["A동: 변이 서로 교차합니다."]);
    expect(zoneViolations([zone("A동", flat)])).toEqual(["A동: 변이 서로 교차합니다."]);
  });

  it("[SPEC-032 R-11] 이름이 비었거나 100자를 넘거나 겹치면 이유를 돌려준다", () => {
    expect(zoneViolations([zone("  ")])).toEqual(["1번째 구역: 이름을 입력해 주세요."]);
    expect(zoneViolations([zone("가".repeat(100))])).toEqual([]);
    expect(zoneViolations([zone("가".repeat(101))])).toEqual([
      "1번째 구역: 이름은 100자 이하로 입력해 주세요.",
    ]);
    expect(zoneViolations([zone("A동"), zone("A동 ")])).toEqual([
      "A동: 같은 이름의 구역이 있습니다.",
    ]);
  });

  it("[SPEC-032 R-11] 구역이 20개를 넘으면 이유를 돌려준다", () => {
    const zones = Array.from({ length: 21 }, (_, index) => zone(`구역 ${String(index + 1)}`));
    expect(zoneViolations(zones.slice(0, 20))).toEqual([]);
    expect(zoneViolations(zones)).toEqual(["구역은 20개까지 만들 수 있습니다."]);
  });
});
