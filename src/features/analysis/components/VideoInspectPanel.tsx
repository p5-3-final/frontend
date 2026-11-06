import { useVideoInspect } from "../hooks/useVideoInspect";
import { InspectResults } from "./InspectResults";

/** 플레이어 아래의 클릭 조회 결과(SPEC-032). */
export function VideoInspectPanel() {
  const { sourceId, controller, inspect, closeInspect } = useVideoInspect();
  return (
    <InspectResults
      sourceId={sourceId}
      inspect={inspect}
      controller={controller}
      onClose={closeInspect}
    />
  );
}
