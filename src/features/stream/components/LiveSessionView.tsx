import { VideoPlayer } from "../../player";
import { useSessionPlayback } from "../hooks/useSessionPlayback";
import type { LiveSession } from "../hooks/useLiveSession";
import { LiveRiskPanel } from "./LiveRiskPanel";
import { LiveTimeline } from "./LiveTimeline";
import { SessionAlertList } from "./SessionAlertList";

export interface LiveSessionViewProps {
  sessionId: string;
  live: LiveSession;
}

/**
 * 열려 있는 실시간 세션 화면(SPEC-031 R-19). 재생은 라이브 HLS 주소를 쓴다.
 * 플레이어가 MediaSource가 있는 브라우저에서는 hls.js를 붙여 재생하고, 없으면 기본 재생을 쓴다.
 */
export function LiveSessionView({ sessionId, live }: LiveSessionViewProps) {
  const playback = useSessionPlayback(sessionId, live.isLive);
  return (
    <div className="flex flex-col gap-4">
      {playback.data?.hlsUrl != null ? (
        <VideoPlayer
          label="실시간 영상 재생"
          src={playback.data.hlsUrl}
          expiresAt={playback.data.expiresAt}
          onExpired={() => {
            void playback.refetch();
          }}
        />
      ) : (
        <p className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
          {playback.isPending ? "실시간 영상을 불러오는 중입니다." : "실시간 영상 주소가 없습니다."}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <LiveRiskPanel sessionId={sessionId} state={live.state} />
        <SessionAlertList alerts={live.alerts} />
      </div>
      <LiveTimeline events={live.events} />
    </div>
  );
}
