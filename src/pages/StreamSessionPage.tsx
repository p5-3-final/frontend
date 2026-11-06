import { useParams } from "react-router";
import { AnalysisResults } from "../features/analysis";
import { usePlayerController } from "../features/player";
import { LiveSessionView, useLiveSession } from "../features/stream";
import { Alert } from "../shared/ui/Alert";

/**
 * 실시간 세션 화면(SPEC-031 R-19). 세션이 열려 있으면 stream-service 라이브 조회를, 닫히면 analysis-api 결과를 보인다.
 * 두 출처는 응답 형식이 달라 같은 패널에 끼우지 않고 화면을 바꾼다(plan 9절).
 */
export function StreamSessionPage() {
  const { sessionId = "" } = useParams();
  const live = useLiveSession(sessionId);
  const controller = usePlayerController();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">실시간 세션</h1>
      {live.isPending ? (
        <p className="text-sm text-muted">세션을 불러오는 중입니다.</p>
      ) : live.error !== null ? (
        <Alert>세션을 찾을 수 없습니다.</Alert>
      ) : live.isLive ? (
        <LiveSessionView sessionId={sessionId} live={live} />
      ) : (
        <AnalysisResults sourceId={sessionId} controller={controller} />
      )}
    </div>
  );
}
