import { createContext, useContext } from "react";
import type { PlayerController } from "../../player";
import type { InspectResult } from "../model/inspectSchemas";
import type { SourceZoneEditor } from "./useSourceZoneEditor";

/** 클릭 조회 상태. `hit`이면 강조할 박스와 트랙 패널, `miss`면 "찾은 객체 없음"이다. */
export type InspectState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "hit"; result: InspectResult }
  | { status: "miss" }
  | { status: "error"; error: Error };

/** 영상 상세의 오버레이·클릭 조회·구역 편집이 함께 쓰는 상태. {@link VideoInspectProvider}가 만든다. */
export interface VideoInspect {
  sourceId: string;
  controller: PlayerController;
  overlayOn: boolean;
  setOverlayOn: (on: boolean) => void;
  editingZones: boolean;
  openZoneEditor: () => void;
  closeZoneEditor: () => void;
  /** 편집 중인 구역(R-10~R-12). 층과 패널이 같은 상태를 그린다. */
  zoneEditor: SourceZoneEditor;
  inspect: InspectState;
  runInspect: (point: { tMs: number; x: number; y: number }) => void;
  closeInspect: () => void;
}

export const VideoInspectContext = createContext<VideoInspect | null>(null);

export function useVideoInspect(): VideoInspect {
  const value = useContext(VideoInspectContext);
  if (value === null) {
    throw new Error("useVideoInspect는 VideoInspectProvider 안에서만 쓴다.");
  }
  return value;
}
