import { formatMediaTime } from "../../../shared/lib/format";
import { eventTypeName } from "../../../shared/lib/messages";
import { Panel } from "../../../shared/ui/Panel";
import type { SessionState } from "../model/schemas";

export interface LiveRiskPanelProps {
  state: SessionState | undefined;
}

/** 실시간 세션의 구역 상태와 활성 위험(SPEC-031 R-19, R-21). */
export function LiveRiskPanel({ state }: LiveRiskPanelProps) {
  return (
    <Panel title="현재 위험">
      {state === undefined ? (
        <p className="text-sm text-muted">현재 상태를 불러오는 중입니다.</p>
      ) : (
        <>
          {state.activeRisks.length === 0 ? (
            <p className="text-sm text-muted">활성 위험이 없습니다.</p>
          ) : (
            <ul aria-label="활성 위험" className="flex flex-col gap-1 text-sm">
              {state.activeRisks.map((risk) => (
                <li
                  key={risk.riskId}
                  className="rounded-lg border-l-4 border-danger bg-panel-raised p-2"
                >
                  <p className="flex flex-wrap gap-x-2">
                    <span className="font-semibold">{eventTypeName(risk.riskType)}</span>
                    <span className="font-mono text-xs text-muted">
                      {formatMediaTime(risk.firstSeenMs)}부터
                    </span>
                  </p>
                  {risk.reason !== null && <p className="text-muted">{risk.reason}</p>}
                  <p className="text-xs">
                    노출 {risk.exposureCount}명 · {risk.exposureSeconds}초
                  </p>
                </li>
              ))}
            </ul>
          )}
          {state.zones.length > 0 && (
            <ul aria-label="구역 상태" className="flex flex-col gap-0.5 text-xs text-muted">
              {state.zones.map((zone) => (
                <li key={zone.zoneId}>
                  {zone.zoneName ?? "전체"}: {zone.currentState ?? "-"}
                </li>
              ))}
            </ul>
          )}
          {state.partialWindows > 0 && (
            <p className="text-xs text-warning">{`일부 구간이 누락되었습니다(${String(state.partialWindows)}개 창)`}</p>
          )}
        </>
      )}
    </Panel>
  );
}
