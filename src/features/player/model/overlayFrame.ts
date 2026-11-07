/** 프레임 크기로 나눈 0~1 박스, 왼쪽 위 기준(계약 NormBox) */
export interface OverlayBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 오버레이에 그릴 트랙 하나. 형식은 계약 OverlayTrack과 같고, 박스는 탐지 시각(ptsMs) 순이다. */
export interface OverlayTrackInput {
  trackId: string;
  className: string;
  hasEvent: boolean;
  boxes: readonly { ptsMs: number; box: OverlayBox }[];
}

/** 지금 그릴 박스 하나 */
export interface FrameBox {
  trackId: string;
  className: string;
  hasEvent: boolean;
  box: OverlayBox;
}

/** 계약 getSourceOverlay의 최대 구간(10초). 재생 시각이 든 구간과 다음 구간을 미리 받는다(SPEC-032 R-1). */
export const OVERLAY_WINDOW_MS = 10_000;

/**
 * 박스가 현재 시각에서 이보다 멀면 그리지 않는다. 탐지 간격 기본값(2fps → 500ms)이다.
 * 트랙이 사라진 뒤 마지막 박스가 화면에 남지 않게 한다.
 */
export const MAX_BOX_GAP_MS = 500;

export function overlayWindowStart(ms: number): number {
  return Math.floor(Math.max(0, ms) / OVERLAY_WINDOW_MS) * OVERLAY_WINDOW_MS;
}

/** ptsMs가 currentMs 이상인 첫 박스의 번호(이진 탐색). 모두 작으면 길이다. */
function lowerBound(boxes: OverlayTrackInput["boxes"], currentMs: number): number {
  let low = 0;
  let high = boxes.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if ((boxes[middle]?.ptsMs ?? Infinity) < currentMs) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

/** 트랙마다 currentMs에 가장 가까운 탐지 시각의 박스를 고른다(R-1). 프레임마다 부르므로 트랙당 O(log n)이다. */
export function frameBoxes(
  tracks: readonly OverlayTrackInput[],
  currentMs: number,
  maxGapMs = MAX_BOX_GAP_MS,
): FrameBox[] {
  const result: FrameBox[] = [];
  for (const track of tracks) {
    const index = lowerBound(track.boxes, currentMs);
    const candidates = [track.boxes[index - 1], track.boxes[index]];
    let best: (typeof track.boxes)[number] | undefined;
    for (const candidate of candidates) {
      if (
        candidate !== undefined &&
        (best === undefined ||
          Math.abs(candidate.ptsMs - currentMs) < Math.abs(best.ptsMs - currentMs))
      ) {
        best = candidate;
      }
    }
    if (best !== undefined && Math.abs(best.ptsMs - currentMs) <= maxGapMs) {
      result.push({
        trackId: track.trackId,
        className: track.className,
        hasEvent: track.hasEvent,
        box: best.box,
      });
    }
  }
  return result;
}

/** 여러 구간 응답의 같은 트랙을 하나로 합치고 박스를 시각 순으로 정렬한다. */
export function mergeOverlayTracks(
  lists: readonly (readonly OverlayTrackInput[])[],
): OverlayTrackInput[] {
  const byId = new Map<string, OverlayTrackInput>();
  for (const list of lists) {
    for (const track of list) {
      const existing = byId.get(track.trackId);
      byId.set(
        track.trackId,
        existing === undefined
          ? track
          : {
              ...existing,
              hasEvent: existing.hasEvent || track.hasEvent,
              boxes: [...existing.boxes, ...track.boxes],
            },
      );
    }
  }
  return [...byId.values()].map((track) => ({
    ...track,
    boxes: [...track.boxes].sort((a, b) => a.ptsMs - b.ptsMs),
  }));
}
