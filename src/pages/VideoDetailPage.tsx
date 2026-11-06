import { useParams } from "react-router";
import { AnalysisResults } from "../features/analysis";
import { usePlayerController } from "../features/player";
import { VideoDetail } from "../features/upload";

/** 영상 상세 화면. 영상마다 고유한 주소를 갖는다(SPEC-006 R-6). 플레이어와 분석 결과가 같은 조작 창구를 쓴다. */
export function VideoDetailPage() {
  const { videoId = "" } = useParams();
  const controller = usePlayerController();
  return (
    <VideoDetail videoId={videoId} controller={controller}>
      <AnalysisResults sourceId={videoId} controller={controller} />
    </VideoDetail>
  );
}
