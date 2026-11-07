import type { GroundingClip } from "./schemas";

export type GroundingFrame = NonNullable<GroundingClip["frames"]>[number];

/** 원본 영상 시각(ms)에 가장 가까운 프레임. 프레임이 없으면 undefined다. */
export function nearestFrame(
  frames: readonly GroundingFrame[] | null,
  atMs: number,
): GroundingFrame | undefined {
  let best: GroundingFrame | undefined;
  for (const frame of frames ?? []) {
    if (best === undefined || Math.abs(frame.ptsMs - atMs) < Math.abs(best.ptsMs - atMs)) {
      best = frame;
    }
  }
  return best;
}
