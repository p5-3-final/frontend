import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { ApiError } from "../../../shared/api/problem";
import { formatMediaTime } from "../../../shared/lib/format";
import { eventTypeName, messageForCode, SEVERITY_NAMES } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Panel } from "../../../shared/ui/Panel";
import type { PlayerController } from "../../player";
import { useEvent } from "../api/useEvent";
import { vlmAnalysisSchema, type EventDetail } from "../model/schemas";
import { descriptionText, verificationName } from "../model/verification";

export interface EventDetailPanelProps {
  eventId: string;
  controller: PlayerController;
  onClose: () => void;
  /** 이벤트 상세 아래에 붙일 내용(운영자 확인·기각) */
  footer?: (detail: EventDetail) => ReactNode;
}

/** 이벤트 상세(SPEC-031 R-5). 근거 프레임, 판정 결과, 조치 제안, 판정 방식과 호출 요약을 보인다. */
export function EventDetailPanel({ eventId, controller, onClose, footer }: EventDetailPanelProps) {
  const { data: detail, error, isPending } = useEvent(eventId);
  // 목록에서 눌러 연 경우는 이미 옮겼다. 주소로 바로 연 경우만 상세를 받은 뒤 한 번 옮긴다(R-5).
  const seekedRef = useRef<string | null>(null);
  useEffect(() => {
    if (detail === undefined || seekedRef.current === detail.event.eventId) {
      return;
    }
    seekedRef.current = detail.event.eventId;
    if (controller.getCurrentMs() !== detail.event.seekMs) {
      controller.seek(detail.event.seekMs);
    }
  }, [controller, detail]);

  const close = (
    <button
      type="button"
      aria-label="이벤트 상세 닫기"
      onClick={onClose}
      className="rounded p-1 text-muted hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <X aria-hidden="true" className="size-4" />
    </button>
  );

  return (
    <Panel title="이벤트 상세" aside={close}>
      {isPending ? (
        <p className="text-sm text-muted">이벤트를 불러오는 중입니다.</p>
      ) : error !== null ? (
        <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>
      ) : (
        <EventDetailBody detail={detail} controller={controller}>
          {footer?.(detail)}
        </EventDetailBody>
      )}
    </Panel>
  );
}

function EventDetailBody({
  detail,
  controller,
  children,
}: {
  detail: EventDetail;
  controller: PlayerController;
  children: ReactNode;
}) {
  const { event } = detail;
  const analysis = vlmAnalysisSchema.safeParse(detail.analysis);
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="flex flex-wrap gap-x-2">
        <span className="font-semibold">{eventTypeName(event.eventType)}</span>
        <span className="font-mono text-muted">
          {formatMediaTime(event.startMs)}–{formatMediaTime(event.endMs)}
        </span>
        {event.severity !== null && <span>{SEVERITY_NAMES[event.severity]}</span>}
        <span className="text-muted">{verificationName(event.verificationStatus)}</span>
      </p>
      {detail.evidenceFrames.length > 0 && (
        <ul aria-label="근거 프레임" className="flex gap-2 overflow-x-auto pb-1">
          {detail.evidenceFrames.map((frame) => (
            <li key={frame.url} className="shrink-0">
              <button
                type="button"
                disabled={frame.ptsMs === null}
                onClick={() => {
                  if (frame.ptsMs !== null) {
                    controller.seek(frame.ptsMs);
                  }
                }}
                className="rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <img
                  src={frame.url}
                  alt={
                    frame.ptsMs === null
                      ? "근거 프레임"
                      : `근거 프레임 ${formatMediaTime(frame.ptsMs)}`
                  }
                  width={128}
                  height={72}
                  loading="lazy"
                  className="h-18 w-32 rounded bg-surface object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      {analysis.success ? (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
          <dt className="text-muted">설명</dt>
          <dd>{descriptionText(analysis.data.verificationStatus, analysis.data.description)}</dd>
          {analysis.data.beforeState !== null && (
            <>
              <dt className="text-muted">이전 상태</dt>
              <dd>{analysis.data.beforeState}</dd>
            </>
          )}
          {analysis.data.afterState !== null && (
            <>
              <dt className="text-muted">이후 상태</dt>
              <dd>{analysis.data.afterState}</dd>
            </>
          )}
          {analysis.data.riskReason !== null && (
            <>
              <dt className="text-muted">위험 사유</dt>
              <dd>{analysis.data.riskReason}</dd>
            </>
          )}
          {analysis.data.solution !== null && (
            <>
              <dt className="text-muted">조치 제안</dt>
              <dd className="flex flex-col gap-1">
                {/* 조치 제안은 모델 출력이라 사람이 확인해야 한다(_vlm-analysis solution 설명). */}
                <span className="self-start rounded bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                  안전관리자 확인 필요
                </span>
                <span>{analysis.data.solution}</span>
              </dd>
            </>
          )}
        </dl>
      ) : (
        <p className="text-muted">판정 결과 형식을 읽을 수 없습니다.</p>
      )}
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
        <dt className="text-muted">판정 방식</dt>
        <dd className="font-mono text-xs">{event.judgmentMethod}</dd>
        {event.zoneName !== null && (
          <>
            <dt className="text-muted">구역</dt>
            <dd>{event.zoneName}</dd>
          </>
        )}
        {detail.reviewReasons.length > 0 && (
          <>
            <dt className="text-muted">검토 사유</dt>
            <dd>{detail.reviewReasons.join(", ")}</dd>
          </>
        )}
      </dl>
      {detail.judgments.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-muted">판정 호출</h3>
          <ul className="flex flex-col gap-0.5 font-mono text-xs">
            {detail.judgments.map((judgment, index) => (
              <li key={`${judgment.taskType}-${String(index)}`}>
                {judgment.taskType} · {judgment.modelId ?? "모델 없음"} ·{" "}
                {judgment.verificationStatus}
              </li>
            ))}
          </ul>
        </div>
      )}
      {children}
    </div>
  );
}
