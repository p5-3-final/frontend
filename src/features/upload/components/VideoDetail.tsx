import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { useVideo } from "../api/useVideo";

export interface VideoDetailProps {
  videoId: string;
}

/** 영상 상세 화면(SPEC-006). */
export function VideoDetail({ videoId }: VideoDetailProps) {
  const { data: video, error, isPending } = useVideo(videoId);

  if (isPending) {
    return <p className="text-sm text-muted">영상 정보를 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>;
  }
  return <h1 className="text-xl font-bold break-all">{video.fileName}</h1>;
}
