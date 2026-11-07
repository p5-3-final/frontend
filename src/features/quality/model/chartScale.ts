// 추이 그래프(SPEC-035 R-15, D-24)는 새 의존성 없이 SVG로 그린다. 축 눈금은 읽기 쉬운 1·2·5 단위로 고른다.
const MAX_TICK_COUNT = 5;
const NICE_STEPS = [1, 2, 5, 10] as const;
// 0.1·0.2 같은 단계를 곱할 때 생기는 부동소수 끝자리(0.6000000000000001)를 없앤다.
const TICK_PRECISION = 10;

/** 0부터 `max`를 덮는 눈금. 눈금 간격은 1·2·5×10ⁿ 중 칸이 다섯 개 이하가 되는 가장 작은 값이다. */
export function niceTicks(max: number): number[] {
  if (max <= 0) {
    return [0, 1];
  }
  const magnitude = 10 ** Math.floor(Math.log10(max / MAX_TICK_COUNT));
  const step =
    NICE_STEPS.map((nice) => nice * magnitude).find((s) => max / s <= MAX_TICK_COUNT) ??
    10 * magnitude;
  const count = Math.ceil(max / step - 1e-9);
  return Array.from({ length: count + 1 }, (_, index) =>
    Number((index * step).toFixed(TICK_PRECISION)),
  );
}

/** n개 날짜 중 index번째의 x 위치. 하루뿐이면 가운데다. */
export function xPosition(index: number, count: number, width: number): number {
  return count <= 1 ? width / 2 : (index / (count - 1)) * width;
}
