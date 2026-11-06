import { useId } from "react";
import { formatMediaTime } from "../../../shared/lib/format";
import {
  eventTypeName,
  SESSION_ROLE_NAMES,
  SUMMARY_STATUS_MESSAGES,
} from "../../../shared/lib/messages";
import { Panel } from "../../../shared/ui/Panel";
import type { PlayerController } from "../../player";
import type { SourceSummary } from "../model/schemas";

export interface SummaryPanelProps {
  summary: SourceSummary;
  controller: PlayerController;
}

const COUNT_LABELS = [
  ["events", "이벤트"],
  ["confirmedEvents", "확정 이벤트"],
  ["activeRisks", "활성 위험"],
] as const;

/** 분석 요약 패널(SPEC-031 R-2). 요약문, 개수, 판정하지 않은 유형, 작업 세션을 보인다. */
export function SummaryPanel({ summary, controller }: SummaryPanelProps) {
  const text = summary.summary;
  const unsupported = Object.entries(summary.unsupportedEvents);
  const unsupportedId = useId();
  return (
    <Panel title="분석 요약">
      {text !== null && text.status === "generated" && text.text !== null ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm leading-relaxed">{text.text}</p>
          {text.highlights.length > 0 && (
            <ul aria-label="요약 강조" className="flex flex-wrap gap-2">
              {text.highlights.map((highlight) => (
                <li key={`${String(highlight.atMs)}-${highlight.text}`}>
                  <button
                    type="button"
                    onClick={() => {
                      controller.seek(highlight.atMs);
                    }}
                    className="rounded-full border border-line bg-panel-raised px-3 py-1 text-xs hover:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    <span className="font-mono text-accent">{formatMediaTime(highlight.atMs)}</span>{" "}
                    {highlight.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        // 요약이 null이면 empty와 같게 본다(plan 4절).
        <p className="text-sm text-muted">
          {
            SUMMARY_STATUS_MESSAGES[
              text === null || text.status === "generated" ? "empty" : text.status
            ]
          }
        </p>
      )}
      <dl className="grid grid-cols-3 gap-2">
        {COUNT_LABELS.map(([key, label]) => (
          <div
            key={key}
            role="group"
            aria-label={label}
            className="rounded-lg bg-panel-raised px-3 py-2"
          >
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{summary.counts[key] ?? 0}</dd>
          </div>
        ))}
      </dl>
      {unsupported.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 id={unsupportedId} className="text-xs font-semibold text-muted">
            이 분석에서 판정하지 않은 이벤트
          </h3>
          <ul aria-labelledby={unsupportedId} className="flex flex-col gap-1 text-sm">
            {unsupported.map(([eventType, reason]) => (
              <li key={eventType} className="flex flex-wrap gap-x-2">
                <span>{eventTypeName(eventType)}</span>
                <span className="text-muted">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {summary.session !== null && (
        <p className="flex flex-wrap gap-x-3 text-sm text-muted">
          <span>{SESSION_ROLE_NAMES[summary.session.role]}</span>
          {summary.session.initialStateUsed && <span>직전 영상의 마지막 상태로 시작함</span>}
        </p>
      )}
    </Panel>
  );
}
