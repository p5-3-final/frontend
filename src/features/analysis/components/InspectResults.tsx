import type { PlayerController } from "../../player";
import { Alert } from "../../../shared/ui/Alert";
import type { InspectState } from "../hooks/useVideoInspect";
import { TrackPanel } from "./TrackPanel";

export interface InspectResultsProps {
  sourceId: string;
  inspect: InspectState;
  controller: PlayerController;
  onClose: () => void;
}

/** 클릭 조회 결과(SPEC-032 R-4, R-6). 찾으면 트랙 패널, 못 찾으면 안내만 보인다. */
export function InspectResults({ sourceId, inspect, controller, onClose }: InspectResultsProps) {
  switch (inspect.status) {
    case "idle":
      return null;
    case "pending":
      return (
        <p role="status" className="text-sm text-muted">
          누른 위치의 객체를 찾는 중입니다.
        </p>
      );
    case "miss":
      // R-6: 패널 대신 안내만 남겨 직전 트랙이 남아 보이지 않게 한다.
      return (
        <p role="status" className="rounded-lg border border-line bg-panel px-3 py-2 text-sm">
          이 위치에서 찾은 객체가 없습니다.
        </p>
      );
    case "error":
      return <Alert>객체를 조회하지 못했습니다. 다시 눌러 주세요.</Alert>;
    case "hit":
      return inspect.result.track === null ? null : (
        <TrackPanel
          key={inspect.result.track.trackId}
          sourceId={sourceId}
          track={inspect.result.track}
          controller={controller}
          onClose={onClose}
        />
      );
  }
}
