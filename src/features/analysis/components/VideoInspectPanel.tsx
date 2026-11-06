import { useVideoInspect } from "../hooks/useVideoInspect";
import { TrackPanel } from "./TrackPanel";

/** 플레이어 아래의 클릭 조회 결과(SPEC-032). */
export function VideoInspectPanel() {
  const { controller, inspect, closeInspect } = useVideoInspect();
  if (inspect.status !== "hit" || inspect.result.track === null) {
    return null;
  }
  return (
    <TrackPanel
      key={inspect.result.track.trackId}
      track={inspect.result.track}
      controller={controller}
      onClose={closeInspect}
    />
  );
}
