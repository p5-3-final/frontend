import type { MarkerGroup, TimelineMarker } from "./types";

// 진행 막대가 500px쯤일 때 1px에 해당하는 간격. 이보다 가까운 표시는 겹쳐 눌리지 않아 하나로 묶는다(plan 4절).
const MIN_GAP_PERCENT = 0.2;

const TONE_RANK: Readonly<Record<TimelineMarker["tone"], number>> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

/** 표시를 진행 막대 위치(%)로 바꾸고 가까운 것끼리 묶는다. 묶음은 가장 높은 severity 색을 쓴다. */
export function groupMarkers(
  markers: readonly TimelineMarker[],
  durationMs: number,
): MarkerGroup[] {
  if (durationMs <= 0) {
    return [];
  }
  const sorted = [...markers].sort((a, b) => a.atMs - b.atMs);
  const groups: MarkerGroup[] = [];
  for (const marker of sorted) {
    const percent = Math.min(100, Math.max(0, (marker.atMs / durationMs) * 100));
    const last = groups.at(-1);
    if (last !== undefined && percent - last.percent < MIN_GAP_PERCENT) {
      groups[groups.length - 1] = {
        ...last,
        count: last.count + 1,
        tone: TONE_RANK[marker.tone] > TONE_RANK[last.tone] ? marker.tone : last.tone,
      };
      continue;
    }
    groups.push({ percent, first: marker, count: 1, tone: marker.tone });
  }
  return groups;
}
