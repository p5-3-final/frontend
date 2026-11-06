import type { MouseEvent } from "react";
import { usePlayerSnapshot } from "../hooks/usePlayerController";
import { usePlayerLayer } from "../hooks/usePlayerLayer";
import type { PlayerController } from "../model/playerController";

export interface InspectLayerProps {
  controller: PlayerController;
  /** 누른 점(0~1)과 현재 시각(ms) */
  onInspect: (point: { tMs: number; x: number; y: number }) => void;
}

/**
 * 클릭 조회 층(SPEC-032 R-3). 일시정지일 때만 그려서 재생 중에는 영상과 컨트롤이 클릭을 그대로 받는다.
 * 마우스·터치 전용이라 키보드 초점을 받지 않는다. 키보드 사용자는 트랙 목록 버튼으로 같은 조회를 한다.
 */
export function InspectLayer({ controller, onInspect }: InspectLayerProps) {
  const { paused } = usePlayerSnapshot(controller);
  const layer = usePlayerLayer();
  if (!paused) {
    return null;
  }
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const point = layer.toFramePoint(event.clientX, event.clientY);
    if (point === null) {
      return;
    }
    onInspect({ tMs: controller.getCurrentMs(), x: point.x, y: point.y });
  };
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label="누른 위치의 객체 조회"
      onClick={handleClick}
      className="pointer-events-auto absolute inset-0 cursor-crosshair"
    />
  );
}
