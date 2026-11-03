import { useRef, useState, type SyntheticEvent } from "react";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { useVideoPlayback } from "../api/useVideoPlayback";
import type { Video } from "../model/schemas";

// 서명 만료는 저장소 시계로 판단한다. 브라우저 시계가 조금 늦어도 만료로 볼 수 있게 만료 1분 전부터 만료로 친다.
const EXPIRY_MARGIN_MS = 60_000;

export interface OriginalPlayerProps {
  video: Video;
}

/** 원본 영상 플레이어. 브라우저가 서명 주소로 저장소에서 바로 읽는다(SPEC-006 R-8). */
export function OriginalPlayer({ video }: OriginalPlayerProps) {
  const { data: playback, error, isPending, refetch } = useVideoPlayback(video.id);
  // 새 주소로 바꾼 뒤 되돌릴 재생 위치. 화면에 그리는 값이 아니라 ref에 둔다.
  const resumeRef = useRef<{ time: number; playing: boolean } | null>(null);
  const [refreshed, setRefreshed] = useState(false);

  if (isPending) {
    return <p className="text-sm text-muted">영상을 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>;
  }
  // SPEC-006 R-11: <video>는 HTTP 상태를 알려 주지 않으므로 만료 여부는 만료 시각으로 판단하고, 새 주소는 한 번만 받는다.
  const handleError = (event: SyntheticEvent<HTMLVideoElement>) => {
    const expired = Date.now() >= Date.parse(playback.expiresAt) - EXPIRY_MARGIN_MS;
    if (refreshed || !expired) {
      return;
    }
    const player = event.currentTarget;
    resumeRef.current = { time: player.currentTime, playing: !player.paused };
    setRefreshed(true);
    void refetch();
  };

  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const resume = resumeRef.current;
    if (resume === null) {
      return;
    }
    resumeRef.current = null;
    const player = event.currentTarget;
    player.currentTime = resume.time;
    if (resume.playing) {
      // 브라우저가 자동 재생을 막으면 사용자가 재생 버튼을 누르면 된다. 위치는 이미 되돌렸다.
      player.play().catch(() => undefined);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- 사용자가 올린 원본에는 자막 파일이 없다 (#26) */}
      <video
        aria-label={`${video.fileName} 재생`}
        src={playback.url}
        controls
        playsInline
        preload="metadata"
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
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
