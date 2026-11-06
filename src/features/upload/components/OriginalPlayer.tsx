import type { ReactNode } from "react";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { VideoPlayer, type PlayerController, type TimelineMarker } from "../../player";
import { useVideoPlayback } from "../api/useVideoPlayback";
import type { Video } from "../model/schemas";

export interface OriginalPlayerProps {
  video: Video;
  controller?: PlayerController;
  markers?: readonly TimelineMarker[];
  onMarkerSelect?: (id: string) => void;
  /** 영상 위 층(SPEC-032) */
  overlay?: ReactNode;
}

/** 원본 영상 플레이어. 브라우저가 서명 주소로 저장소에서 바로 읽는다(SPEC-006 R-8). */
export function OriginalPlayer({
  video,
  controller,
  markers,
  onMarkerSelect,
  overlay,
}: OriginalPlayerProps) {
  const { data: playback, error, isPending, refetch } = useVideoPlayback(video.id);

  if (isPending) {
    return <p className="text-sm text-muted">영상을 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>;
  }
  return (
    <VideoPlayer
      label={`${video.fileName} 재생`}
      src={playback.url}
      downloadUrl={playback.downloadUrl}
      expiresAt={playback.expiresAt}
      onExpired={() => {
        void refetch();
      }}
      controller={controller}
      markers={markers}
      onMarkerSelect={onMarkerSelect}
      overlay={overlay}
    />
  );
}
