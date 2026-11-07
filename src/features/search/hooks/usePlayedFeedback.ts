import { useEffect, useEffectEvent } from "react";
import { useLocation } from "react-router";
import type { PlayerController, PlayerSnapshot } from "../../player";
import { useMomentFeedback } from "../api/useMomentFeedback";
import { readSearchMomentId } from "../model/jumpState";

/** SPEC-033 R-11: 이동한 영상을 이 시간보다 오래 재생하면 played를 기록한다. */
export const PLAYED_THRESHOLD_MS = 5000;
// timeupdate는 브라우저에서 0.25초 안팎마다 온다. 한 번에 이보다 많이 움직였으면 재생이 아니라 이동(seek)으로 본다.
const MAX_PLAY_STEP_MS = 2000;

/**
 * 검색 결과에서 이동해 온 영상 상세(`location.state`에 결과 ID)에서 재생 시간을 센다.
 * 일시정지 중의 위치 변화와 이동은 빼고, 누적이 5초를 넘는 순간 played(재생 길이)를 한 번 보낸다.
 */
export function usePlayedFeedback(controller: PlayerController): void {
  const location = useLocation();
  const momentId = readSearchMomentId(location.state);
  const feedback = useMomentFeedback();
  const alreadyPlayed = useEffectEvent((id: string) => feedback.hasSent(id, "played"));
  const recordPlayed = useEffectEvent((id: string, playedMs: number) => {
    feedback.send(id, "played", playedMs);
  });

  // controller는 React 밖의 <video>를 다루는 외부 시스템이라 구독으로 읽는다.
  useEffect(() => {
    if (momentId === undefined || alreadyPlayed(momentId)) {
      return;
    }
    let previous: PlayerSnapshot = controller.getSnapshot();
    let playedMs = 0;
    const unsubscribe = controller.subscribe(() => {
      const next = controller.getSnapshot();
      const step = next.currentMs - previous.currentMs;
      previous = next;
      if (next.paused || step <= 0 || step > MAX_PLAY_STEP_MS) {
        return;
      }
      playedMs += step;
      if (playedMs > PLAYED_THRESHOLD_MS) {
        recordPlayed(momentId, playedMs);
        unsubscribe();
      }
    });
    return unsubscribe;
  }, [controller, momentId]);
}
