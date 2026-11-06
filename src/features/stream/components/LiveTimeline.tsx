import { formatMediaTime } from "../../../shared/lib/format";
import { eventTypeName, SEVERITY_NAMES, VERIFICATION_NAMES } from "../../../shared/lib/messages";
import { Panel } from "../../../shared/ui/Panel";
import type { LiveEvent } from "../model/schemas";

export interface LiveTimelineProps {
  events: LiveEvent[] | undefined;
}

/** 실시간 세션 타임라인(SPEC-031 R-19). 최근 100건을 시각 순으로 보인다. */
export function LiveTimeline({ events }: LiveTimelineProps) {
  return (
    <Panel title="실시간 타임라인">
      {events === undefined ? (
        <p className="text-sm text-muted">타임라인을 불러오는 중입니다.</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted">아직 이벤트가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {events.map((event) => (
            <li key={event.eventId} className="flex flex-col rounded-lg bg-panel-raised p-2">
              <span className="flex flex-wrap gap-x-2">
                <span className="font-semibold">{eventTypeName(event.eventType)}</span>
                <span className="font-mono text-xs text-muted">
                  {formatMediaTime(event.startMs)}
                </span>
                {event.severity !== null && (
                  <span className="text-xs">{`심각도 ${SEVERITY_NAMES[event.severity]}`}</span>
                )}
                <span className="text-xs text-muted">
                  {VERIFICATION_NAMES[event.verificationStatus]}
                </span>
              </span>
              {event.description !== null && (
                <span className="text-xs text-muted">{event.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
