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
 * 브라우저가 HLS를 바로 재생하지 못하면(Chromium 등) 플레이어가 재생할 수 없다는 안내를 보인다(HLS 라이브러리 도입은 별도 결정).
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
