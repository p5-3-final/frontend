import { useRef, useState, type SyntheticEvent } from "react";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode, UNSUPPORTED_PLAYBACK_MESSAGE } from "../../../shared/lib/messages";
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
  const [unsupported, setUnsupported] = useState(false);

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
      // SPEC-006 R-10: 만료 전 오류나 새 주소로도 난 오류는 이 브라우저가 형식·코덱을 재생하지 못한 것으로 본다.
      setUnsupported(true);
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

  const download = (
    <a
      href={playback.downloadUrl}
      className="self-start text-sm text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      원본 내려받기
    </a>
  );

  if (unsupported) {
    return (
      <div className="flex flex-col gap-2">
        <Alert>{UNSUPPORTED_PLAYBACK_MESSAGE}</Alert>
        {download}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- 사용자가 올린 원본에는 자막 파일이 없다 (#26) */}
      <video
        aria-label={`${video.fileName} 재생`}
        src={playback.url}
        controls
        // SPEC-006 NFR-4: Safari 등은 기본 설정에서 <video>를 Tab으로 건너뛰므로 명시적으로 초점을 받게 한다.
        tabIndex={0}
        playsInline
        preload="metadata"
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
        className="max-h-[70vh] w-full rounded-xl bg-black"
      />
      {download}
    </div>
  );
}
