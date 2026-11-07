/** 구역 저장 조건(SPEC-032 R-11). 계약 ZoneDefinition·ZoneList의 제약과 같다. */
export const ZONE_LIMITS = {
  minVertices: 3,
  maxVertices: 32,
  maxZones: 20,
  maxNameLength: 100,
} as const;

interface Point {
  x: number;
  y: number;
}

/** 검사에 필요한 구역 필드 */
export interface ZoneShape {
  name: string;
  polygon: readonly Point[];
}

// 좌표가 0~1이라 이보다 작은 넓이·외적은 0으로 본다(부동소수 오차).
const EPSILON = 1e-12;

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function sign(value: number): -1 | 0 | 1 {
  if (Math.abs(value) < EPSILON) {
    return 0;
  }
  return value > 0 ? 1 : -1;
}

/** 일직선에 있는 q가 선분 pr 위(끝점 포함)에 있는가 */
function onSegment(p: Point, q: Point, r: Point): boolean {
  return (
    Math.min(p.x, r.x) - EPSILON <= q.x &&
    q.x <= Math.max(p.x, r.x) + EPSILON &&
    Math.min(p.y, r.y) - EPSILON <= q.y &&
    q.y <= Math.max(p.y, r.y) + EPSILON
  );
}

/** 두 선분이 만나는가(맞닿음·겹침 포함). 방향 판정으로 본다. */
export function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = sign(cross(c, d, a));
  const d2 = sign(cross(c, d, b));
  const d3 = sign(cross(a, b, c));
  const d4 = sign(cross(a, b, d));
  if (d1 !== d2 && d3 !== d4 && d1 !== 0 && d2 !== 0 && d3 !== 0 && d4 !== 0) {
    return true;
  }
  return (
    (d1 === 0 && onSegment(c, a, d)) ||
    (d2 === 0 && onSegment(c, b, d)) ||
    (d3 === 0 && onSegment(a, c, b)) ||
    (d4 === 0 && onSegment(a, d, b))
  );
}

function area(polygon: readonly Point[]): number {
  let sum = 0;
  polygon.forEach((point, index) => {
    const next = polygon[(index + 1) % polygon.length] ?? point;
    sum += point.x * next.y - next.x * point.y;
  });
  return Math.abs(sum) / 2;
}

/**
 * 다각형이 자기 자신과 교차하는가. 이웃하지 않은 변끼리 만나거나(맞닿음 포함) 넓이가 없으면 교차로 본다.
 * 꼭짓점이 32개 이하라 변 쌍을 모두 보는 O(n²)(최대 496쌍)로 충분하다.
 */
export function isSelfIntersecting(polygon: readonly Point[]): boolean {
  const count = polygon.length;
  if (count < ZONE_LIMITS.minVertices) {
    return false;
  }
  if (area(polygon) < EPSILON) {
    return true;
  }
  const at = (index: number): Point => polygon[index % count] ?? { x: 0, y: 0 };
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === count - 1);
      if (!adjacent && segmentsIntersect(at(i), at(i + 1), at(j), at(j + 1))) {
        return true;
      }
    }
  }
  return false;
}

/** 저장을 막는 이유 목록. 비어 있으면 저장할 수 있다(R-11). */
export function zoneViolations(zones: readonly ZoneShape[]): string[] {
  const reasons: string[] = [];
  if (zones.length > ZONE_LIMITS.maxZones) {
    reasons.push(`구역은 ${String(ZONE_LIMITS.maxZones)}개까지 만들 수 있습니다.`);
  }
  const seen = new Set<string>();
  zones.forEach((zone, index) => {
    const name = zone.name.trim();
    const nameValid = name.length > 0 && name.length <= ZONE_LIMITS.maxNameLength;
    // 이름이 비었거나 너무 길면 이유에 이름 대신 순서를 쓴다.
    const label = nameValid ? name : `${String(index + 1)}번째 구역`;
    if (name.length === 0) {
      reasons.push(`${label}: 이름을 입력해 주세요.`);
    } else if (!nameValid) {
      reasons.push(`${label}: 이름은 ${String(ZONE_LIMITS.maxNameLength)}자 이하로 입력해 주세요.`);
    } else if (seen.has(name)) {
      reasons.push(`${label}: 같은 이름의 구역이 있습니다.`);
    }
    seen.add(name);
    if (zone.polygon.length < ZONE_LIMITS.minVertices) {
      reasons.push(`${label}: 꼭짓점이 ${String(ZONE_LIMITS.minVertices)}개 이상이어야 합니다.`);
    } else if (zone.polygon.length > ZONE_LIMITS.maxVertices) {
      reasons.push(`${label}: 꼭짓점은 ${String(ZONE_LIMITS.maxVertices)}개까지 둘 수 있습니다.`);
    } else if (isSelfIntersecting(zone.polygon)) {
      reasons.push(`${label}: 변이 서로 교차합니다.`);
    }
  });
  return reasons;
}
