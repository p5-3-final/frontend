import { OverlayLayer, usePlayerSnapshot, type PlayerController } from "../../player";
import { objectClassName } from "../../../shared/lib/messages";
import { useSourceOverlay } from "../api/useSourceOverlay";

export interface SourceOverlayProps {
  sourceId: string;
  controller: PlayerController;
}

/** 영상의 트랙 박스 오버레이(SPEC-032 R-1, R-2). 받을 구간은 플레이어 상태(초당 몇 번)로 고른다. */
export function SourceOverlay({ sourceId, controller }: SourceOverlayProps) {
  const { currentMs } = usePlayerSnapshot(controller);
  const { tracks } = useSourceOverlay(sourceId, currentMs, true);
  return (
    <OverlayLayer
      controller={controller}
      tracks={tracks}
      // R-2: 색만으로 구분하지 않도록 이벤트 트랙은 글자로도 알린다.
      formatLabel={(box) => `${objectClassName(box.className)}${box.hasEvent ? " · 이벤트" : ""}`}
    />
  );
}
