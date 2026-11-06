import { formatMediaTime } from "../../../shared/lib/format";
import { eventTypeName, SEVERITY_NAMES } from "../../../shared/lib/messages";
import { Panel } from "../../../shared/ui/Panel";
import type { SessionAlert } from "../model/schemas";

export interface SessionAlertListProps {
  alerts: SessionAlert[] | undefined;
}

const ALERT_STATUS_NAMES = { pending: "확인 중", confirmed: "확정", dismissed: "기각됨" } as const;

/** 세션 긴급 알림 목록(SPEC-031 R-19). candidateId마다 최신 상태 하나다. */
export function SessionAlertList({ alerts }: SessionAlertListProps) {
  return (
    <Panel title="긴급 알림">
      {alerts === undefined ? (
        <p className="text-sm text-muted">긴급 알림을 불러오는 중입니다.</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-muted">긴급 알림이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {alerts.map((alert) => (
            <li
              key={alert.candidateId}
              className="flex flex-wrap gap-x-2 rounded-lg bg-panel-raised p-2"
            >
              <span className="font-semibold">{eventTypeName(alert.eventType)}</span>
              <span className="font-mono text-xs text-muted">
                {formatMediaTime(alert.observedMs)}
              </span>
              <span className="text-xs">{`심각도 ${SEVERITY_NAMES[alert.severity]}`}</span>
              <span className="text-xs text-muted">{ALERT_STATUS_NAMES[alert.status]}</span>
              {alert.status !== "dismissed" && alert.description !== null && (
                <span className="w-full text-xs text-muted">{alert.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
