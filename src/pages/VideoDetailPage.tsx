import { useParams } from "react-router";
import { VideoDetail } from "../features/upload";

/** 영상 상세 화면. 영상마다 고유한 주소를 갖는다(SPEC-006 R-6). */
export function VideoDetailPage() {
  const { videoId = "" } = useParams();
  return <VideoDetail videoId={videoId} />;
}
