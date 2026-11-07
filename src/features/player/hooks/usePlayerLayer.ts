import { createContext, useContext } from "react";
import type { ContentRect, FramePoint } from "../model/contentRect";

/** 영상 위 층이 쓰는 표시 영역과 좌표 변환. 플레이어가 표시 영역 위에 층을 놓을 때 함께 넘긴다. */
export interface PlayerLayer {
  /** `<video>` 요소 기준 표시 영역(px) */
  rect: ContentRect;
  /** 화면 좌표(clientX·clientY)를 0~1 좌표로 바꾼다. 표시 영역 밖이면 null이다(R-3). */
  toFramePoint: (clientX: number, clientY: number) => FramePoint | null;
  /** 화면 좌표를 0~1 범위로 잘라 바꾼다. 꼭짓점을 끌다 영역 밖으로 나가도 가장자리에 붙인다(R-11). */
  toClampedFramePoint: (clientX: number, clientY: number) => FramePoint;
}

export const PlayerLayerContext = createContext<PlayerLayer | null>(null);

/** 플레이어의 `overlay` 안에서만 쓴다. 표시 영역을 계산한 뒤에만 층이 그려지므로 항상 값이 있다. */
export function usePlayerLayer(): PlayerLayer {
  const layer = useContext(PlayerLayerContext);
  if (layer === null) {
    throw new Error("usePlayerLayer는 VideoPlayer의 overlay 안에서만 쓴다.");
  }
  return layer;
}
