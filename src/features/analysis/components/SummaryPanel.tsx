import { useId } from "react";
import { formatMediaTime } from "../../../shared/lib/format";
import {
  eventTypeName,
  SESSION_ROLE_NAMES,
  SUMMARY_STATUS_MESSAGES,
} from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Panel } from "../../../shared/ui/Panel";
import type { PlayerController } from "../../player";
import type { SourceSummary } from "../model/schemas";

export interface SummaryPanelProps {
  summary: SourceSummary;
  controller: PlayerController;
  /** 예산·상한 초과로 판정하지 않은 이벤트 수(R-23). `more`면 첫 쪽만 센 하한이다. */
  budgetSkipped?: { count: number; more: boolean };
}

/** 누락 건수. 이벤트 키가 있으면 그 값을, 없으면 모든 키의 합을 쓴다(source.completed missingCounts). */
function missingCount(missing: Readonly<Record<string, number>>): number {
  return missing.events ?? Object.values(missing).reduce((sum, value) => sum + value, 0);
}

const COUNT_LABELS = [
  ["events", "이벤트"],
  ["confirmedEvents", "확정 이벤트"],
  ["activeRisks", "활성 위험"],
] as const;

/** 분석 요약 패널(SPEC-031 R-2). 요약문, 개수, 판정하지 않은 유형, 작업 세션을 보인다. */
export function SummaryPanel({ summary, controller, budgetSkipped }: SummaryPanelProps) {
  const text = summary.summary;
  const unsupported = Object.entries(summary.unsupportedEvents);
  const unsupportedId = useId();
  return (
    <Panel title="분석 요약">
      {summary.partial === true && (
        <Alert>{`일부 이벤트가 누락되었습니다(${String(missingCount(summary.missingCounts ?? {}))}건)`}</Alert>
      )}
      {budgetSkipped !== undefined && budgetSkipped.count > 0 && (
        <div className="flex flex-col gap-0.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <p>{`예산·상한 초과로 판정하지 않은 이벤트 ${String(budgetSkipped.count)}건${budgetSkipped.more ? " 이상" : ""}`}</p>
          <p className="text-xs">운영자가 재분석하면 다시 판정합니다.</p>
        </div>
      )}
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
