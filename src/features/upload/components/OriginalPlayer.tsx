import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { useVideoPlayback } from "../api/useVideoPlayback";
import type { Video } from "../model/schemas";

export interface OriginalPlayerProps {
  video: Video;
}

/** 원본 영상 플레이어. 브라우저가 서명 주소로 저장소에서 바로 읽는다(SPEC-006 R-8). */
export function OriginalPlayer({ video }: OriginalPlayerProps) {
  const { data: playback, error, isPending } = useVideoPlayback(video.id);

  if (isPending) {
    return <p className="text-sm text-muted">영상을 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>;
  }
  return (
    <div className="flex flex-col gap-2">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- 사용자가 올린 원본에는 자막 파일이 없다 (#26) */}
      <video
        aria-label={`${video.fileName} 재생`}
        src={playback.url}
        controls
        playsInline
        preload="metadata"
        className="max-h-[70vh] w-full rounded-xl bg-black"
      />
      <a
        href={playback.downloadUrl}
        className="self-start text-sm text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        원본 내려받기
      </a>
    </div>
  );
}
