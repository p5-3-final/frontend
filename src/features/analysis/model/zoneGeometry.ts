/** 다각형 꼭짓점의 평균. 구역 이름을 그릴 자리다. */
export function polygonCenter(polygon: readonly { x: number; y: number }[]): {
  x: number;
  y: number;
} {
  if (polygon.length === 0) {
    return { x: 0.5, y: 0.5 };
  }
  const sum = polygon.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / polygon.length, y: sum.y / polygon.length };
}
