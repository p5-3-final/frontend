import { useState, type ReactNode } from "react";
import type { PlayerController } from "../../player";
import { useInspectPoint } from "../api/useInspectPoint";
import { useSourceZoneEditor } from "../hooks/useSourceZoneEditor";
import {
  VideoInspectContext,
  type InspectState,
  type VideoInspect,
} from "../hooks/useVideoInspect";

export interface VideoInspectProviderProps {
  sourceId: string;
  controller: PlayerController;
  children: ReactNode;
}

/**
 * 영상 상세의 오버레이·클릭 조회·구역 편집 상태(SPEC-032). 층(`VideoInspectLayers`)은 플레이어 위에,
 * 패널(`VideoInspectPanel`)은 플레이어 아래에 그려지므로 상태를 여기에 두고 둘이 함께 읽는다.
 * 영상을 바꾸면 `key`로 새로 만들어 오버레이가 다시 꺼진다(R-2).
 */
export function VideoInspectProvider({
  sourceId,
  controller,
  children,
}: VideoInspectProviderProps) {
  const [overlayOn, setOverlayOn] = useState(false);
  const [editingZones, setEditingZones] = useState(false);
  const mutation = useInspectPoint(sourceId);
  const zoneEditor = useSourceZoneEditor(sourceId, editingZones);

  const inspect = toInspectState(mutation);
  const value: VideoInspect = {
    sourceId,
    controller,
    overlayOn,
    setOverlayOn,
    editingZones,
    openZoneEditor: () => {
      // R-10: 멈춘 프레임 위에서 그린다. 편집 중에는 조회 결과를 닫는다.
      controller.pause();
      mutation.reset();
      setEditingZones(true);
    },
    closeZoneEditor: () => {
      // 저장하지 않은 편집은 버린다. 다시 열면 저장된 구역부터 시작한다.
      zoneEditor.discard();
      setEditingZones(false);
    },
    zoneEditor,
    inspect,
    runInspect: (point) => {
      mutation.mutate(point);
    },
    closeInspect: () => {
      mutation.reset();
    },
  };
  return <VideoInspectContext value={value}>{children}</VideoInspectContext>;
}

function toInspectState(mutation: ReturnType<typeof useInspectPoint>): InspectState {
  if (mutation.isPending) {
    return { status: "pending" };
  }
  if (mutation.error !== null) {
    return { status: "error", error: mutation.error };
  }
  if (mutation.data === undefined) {
    return { status: "idle" };
  }
  return mutation.data.hit && mutation.data.track !== null
    ? { status: "hit", result: mutation.data }
    : { status: "miss" };
}
