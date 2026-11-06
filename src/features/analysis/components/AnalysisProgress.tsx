import { useState } from "react";
import { JOB_STATUS_NAMES } from "../../../shared/lib/messages";
import { ProgressBar } from "../../../shared/ui/ProgressBar";
import { useNotification } from "../../notifications";

export interface AnalysisProgressProps {
  sourceId: string;
  /** 진행 알림 전에도 "진행 상태 확인 중"을 보일지(분석 결과가 아직 없을 때) */
  awaiting: boolean;
}

interface Progress {
  percent: number;
  status: string;
  terminal: boolean;
}

/**
 * 분석 진행률(SPEC-031 R-15). 열린 영상의 job.status 알림으로만 갱신하고, 끝난 상태(terminal)면 닫는다.
 * 진행률을 읽는 공개 API가 계약에 없어(C-22) 첫 알림 전에는 "진행 상태 확인 중"을 보인다.
 * 진행 값은 이 컴포넌트 상태에만 두고 서버 데이터 캐시에 넣지 않는다.
 */
export function AnalysisProgress({ sourceId, awaiting }: AnalysisProgressProps) {
  const [progress, setProgress] = useState<Progress | null>(null);
  useNotification(
    "job.status",
    (message) => {
      setProgress({
        percent: message.data.progressPercent,
        status: message.data.status,
        terminal: message.data.terminal,
      });
    },
    { sourceId },
  );

  if (progress === null) {
    return awaiting ? (
      <p role="status" className="text-sm text-muted">
        진행 상태 확인 중
      </p>
    ) : null;
  }
  if (progress.terminal) {
    return null;
  }
  const name = JOB_STATUS_NAMES[progress.status] ?? progress.status;
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-panel p-3">
      <p className="text-sm">{`${name} ${String(progress.percent)}%`}</p>
      <ProgressBar percent={progress.percent} label="분석 진행률" />
    </div>
  );
}
