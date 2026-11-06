import { useQuery } from "@tanstack/react-query";
import {
  getSession,
  getSessionState,
  listSessionAlerts,
  listSessionEvents,
} from "../api/streamApi";
import { streamQueryKeys } from "../model/queryKeys";
import type {
  LiveEvent,
  Session,
  SessionAlert,
  SessionState,
  SessionStatus,
} from "../model/schemas";

/**
 * 알림 연결이 끊겼을 때를 대비한 다시 읽기 간격(plan 9절). 평소에는 state.updated·alert.raised가 먼저 반영한다.
 */
export const LIVE_POLL_MS = 10_000;

const LIVE_STATUSES: ReadonlySet<SessionStatus> = new Set(["STARTING", "LIVE", "STOPPING"]);

export interface LiveSession {
  session: Session | undefined;
  /** 세션이 아직 열려 있으면 참. 닫히면(CLOSED·FAILED) 화면은 analysis 결과로 바꾼다(R-19). */
  isLive: boolean;
  isPending: boolean;
  error: Error | null;
  state: SessionState | undefined;
  events: LiveEvent[] | undefined;
  alerts: SessionAlert[] | undefined;
}

/** 실시간 세션의 상태·타임라인·알림(SPEC-031 R-19). 열려 있는 동안만 stream API를 10초마다 다시 읽는다. */
export function useLiveSession(sessionId: string): LiveSession {
  const session = useQuery({
    queryKey: streamQueryKeys.session(sessionId),
    queryFn: () => getSession(sessionId),
    refetchInterval: (query) =>
      query.state.data !== undefined && LIVE_STATUSES.has(query.state.data.status)
        ? LIVE_POLL_MS
        : false,
  });
  const isLive = session.data !== undefined && LIVE_STATUSES.has(session.data.status);
  const live = { enabled: isLive, refetchInterval: isLive ? LIVE_POLL_MS : false } as const;
  const state = useQuery({
    queryKey: streamQueryKeys.state(sessionId),
    queryFn: () => getSessionState(sessionId),
    ...live,
  });
  const events = useQuery({
    queryKey: streamQueryKeys.events(sessionId),
    queryFn: () => listSessionEvents(sessionId),
    ...live,
    // 근거 프레임 서명 주소가 들어 있어 화면을 떠나면 바로 버린다(NFR-3).
    gcTime: 0,
  });
  const alerts = useQuery({
    queryKey: streamQueryKeys.alerts(sessionId),
    queryFn: () => listSessionAlerts(sessionId),
    ...live,
    gcTime: 0,
  });
  return {
    session: session.data,
    isLive,
    isPending: session.isPending,
    error: session.error,
    state: state.data,
    events: events.data?.items,
    alerts: alerts.data?.items,
  };
}
