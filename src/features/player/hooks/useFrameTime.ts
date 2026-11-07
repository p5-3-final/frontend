import { useEffect, useRef, useState, type RefObject } from "react";
import type { PlayerController } from "../model/playerController";
import { usePlayerSnapshot } from "./usePlayerController";

/**
 * 화면 갱신마다 읽는 재생 위치(ms). `timeupdate`는 4Hz 정도라 박스가 끊겨 보여서, 재생 중에는
 * requestAnimationFrame으로 읽는다(SPEC-032 R-1). 멈춰 있으면 플레이어 상태 값을 그대로 쓴다.
 * `frameStartedAtRef`은 이번 갱신을 시작한 시각으로, 그리기 시간 측정(NFR-1)에 쓴다.
 */
export function useFrameTime(controller: PlayerController): {
  currentMs: number;
  frameStartedAtRef: RefObject<number | null>;
} {
  const snapshot = usePlayerSnapshot(controller);
  const [liveMs, setLiveMs] = useState(snapshot.currentMs);
  const frameStartedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (snapshot.paused) {
      return;
    }
    let handle = 0;
    const tick = () => {
      frameStartedAtRef.current = performance.now();
      setLiveMs(controller.getCurrentMs());
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(handle);
    };
  }, [controller, snapshot.paused]);
  return { currentMs: snapshot.paused ? snapshot.currentMs : liveMs, frameStartedAtRef };
}
