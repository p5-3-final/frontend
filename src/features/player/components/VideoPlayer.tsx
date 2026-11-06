import { useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { UNSUPPORTED_PLAYBACK_MESSAGE } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { usePlayerController } from "../hooks/usePlayerController";
import type { PlayerController } from "../model/playerController";
import type { TimelineMarker } from "../model/types";
import { PlayerControls } from "./PlayerControls";

// 서명 만료는 저장소 시계로 판단한다. 브라우저 시계가 조금 늦어도 만료로 볼 수 있게 만료 1분 전부터 만료로 친다.
const EXPIRY_MARGIN_MS = 60_000;

export interface VideoPlayerProps {
  /** `<video>`의 접근 가능한 이름. 예: "a.mp4 재생" */
  label: string;
  src: string;
  /** 재생하지 못할 때 보여 줄 원본 내려받기 주소 */
  downloadUrl?: string;
  /** 서명 주소의 만료 시각. 만료 뒤 오류가 나면 `onExpired`로 새 주소를 한 번 요청한다. */
  expiresAt?: string;
  onExpired?: () => void;
  /** 페이지가 만든 조작 창구. 주지 않으면 플레이어가 자기 것을 만든다. */
  controller?: PlayerController;
  /** 영상 위에 겹쳐 그릴 층(SPEC-032 오버레이·클릭 조회) */
  overlay?: ReactNode;
  /** 진행 막대 위 표시(SPEC-031 R-4) */
  markers?: readonly TimelineMarker[];
  onMarkerSelect?: (id: string) => void;
}

/**
 * 영상 플레이어. 서명 주소 만료 시 새 주소로 보던 위치부터 이어서 재생한다(SPEC-006 R-10, R-11).
 * 브라우저 기본 컨트롤 대신 자체 컨트롤을 써서 진행 막대 위에 이벤트를 표시한다(SPEC-031 R-4).
 * 키보드는 컨트롤의 버튼과 진행 막대로 조작한다(SPEC-006 NFR-4).
 */
export function VideoPlayer({
  label,
  src,
  downloadUrl,
  expiresAt,
  onExpired,
  controller,
  overlay,
  markers,
  onMarkerSelect,
}: VideoPlayerProps) {
  const ownController = usePlayerController();
  const player = controller ?? ownController;
  // 새 주소로 바꾼 뒤 되돌릴 재생 위치. 화면에 그리는 값이 아니라 ref에 둔다.
  const resumeRef = useRef<{ time: number; playing: boolean } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [refreshed, setRefreshed] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  // SPEC-006 R-11: <video>는 HTTP 상태를 알려 주지 않으므로 만료 여부는 만료 시각으로 판단하고, 새 주소는 한 번만 받는다.
  const handleError = (event: SyntheticEvent<HTMLVideoElement>) => {
    const expired =
      expiresAt !== undefined && Date.now() >= Date.parse(expiresAt) - EXPIRY_MARGIN_MS;
    if (refreshed || !expired || onExpired === undefined) {
      // SPEC-006 R-10: 만료 전 오류나 새 주소로도 난 오류는 이 브라우저가 형식·코덱을 재생하지 못한 것으로 본다.
      setUnsupported(true);
      return;
    }
    const element = event.currentTarget;
    resumeRef.current = { time: element.currentTime, playing: !element.paused };
    setRefreshed(true);
    onExpired();
  };

  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const resume = resumeRef.current;
    if (resume === null) {
      return;
    }
    resumeRef.current = null;
    const element = event.currentTarget;
    element.currentTime = resume.time;
    if (resume.playing) {
      // 브라우저가 자동 재생을 막으면 사용자가 재생 버튼을 누르면 된다. 위치는 이미 되돌렸다.
      element.play().catch(() => undefined);
    }
  };

  const attachVideo = (element: HTMLVideoElement | null) => {
    player.attach(element);
  };

  const download =
    downloadUrl === undefined ? null : (
      <a
        href={downloadUrl}
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
      <div ref={frameRef} className="relative flex flex-col gap-1 rounded-xl bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- 사용자가 올린 원본에는 자막 파일이 없다 (#26) */}
        <video
          ref={attachVideo}
          aria-label={label}
          src={src}
          playsInline
          preload="metadata"
          onError={handleError}
          onLoadedMetadata={handleLoadedMetadata}
          className="max-h-[70vh] w-full rounded-xl bg-black"
        />
        {overlay}
        <PlayerControls
          controller={player}
          markers={markers}
          onMarkerSelect={onMarkerSelect}
          onFullscreen={() => {
            // 영상만이 아니라 표시와 오버레이까지 함께 전체 화면으로 보인다.
            frameRef.current?.requestFullscreen().catch(() => undefined);
          }}
        />
      </div>
      {download}
    </div>
  );
}
