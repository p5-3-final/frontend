import { useParams } from "react-router";
import { AnalysisResults, useEventSelection, useTimelineMarkers } from "../features/analysis";
import { usePlayerController } from "../features/player";
import { VideoDetail } from "../features/upload";

/**
 * 영상 상세 화면. 영상마다 고유한 주소를 갖는다(SPEC-006 R-6).
 * 플레이어(upload)와 분석 결과(analysis)가 같은 조작 창구를 쓰고, 진행 막대 표시를 누르면 결과 패널의 이벤트가 열린다.
 */
export function VideoDetailPage() {
  const { videoId = "" } = useParams();
  const controller = usePlayerController();
  const markers = useTimelineMarkers(videoId);
  const selection = useEventSelection(controller);
  return (
    <VideoDetail
      videoId={videoId}
      controller={controller}
      markers={markers}
      onMarkerSelect={selection.open}
    >
      <AnalysisResults sourceId={videoId} controller={controller} />
    </VideoDetail>
  );
}
