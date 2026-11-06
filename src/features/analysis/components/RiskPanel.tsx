import { formatMediaTime } from "../../../shared/lib/format";
import { eventTypeName } from "../../../shared/lib/messages";
import { Panel } from "../../../shared/ui/Panel";
import type { PlayerController } from "../../player";
import { useSourceRisks } from "../api/useSourceRisks";
import type { Risk } from "../model/schemas";
import { AnalysisError } from "./AnalysisError";

export interface RiskPanelProps {
  sourceId: string;
  controller: PlayerController;
}

/** 위험 상태 패널(SPEC-031 R-8). 활성 위험을 먼저, 해소된 위험을 다음에 보인다. */
export function RiskPanel({ sourceId, controller }: RiskPanelProps) {
  const { data, error, isPending, refetch } = useSourceRisks(sourceId);
  return (
    <Panel title="위험 상태">
      {isPending ? (
        <p className="text-sm text-muted">위험 상태를 불러오는 중입니다.</p>
      ) : error !== null ? (
        <AnalysisError
          error={error}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : data.items.length === 0 ? (
        <p className="text-sm text-muted">위험 상태가 없습니다.</p>
      ) : (
        <>
          <RiskGroup
            title="활성 위험"
            risks={data.items.filter((risk) => risk.status === "active")}
            controller={controller}
          />
          <RiskGroup
            title="해소된 위험"
            risks={data.items.filter((risk) => risk.status === "resolved")}
            controller={controller}
          />
        </>
      )}
    </Panel>
  );
}

function RiskGroup({
  title,
  risks,
  controller,
}: {
  title: string;
  risks: Risk[];
  controller: PlayerController;
}) {
  if (risks.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold text-muted">{title}</h3>
      <ul aria-label={title} className="flex flex-col gap-1">
        {risks.map((risk) => (
          <RiskRow key={risk.riskId} risk={risk} controller={controller} />
        ))}
      </ul>
    </div>
  );
}

function RiskRow({ risk, controller }: { risk: Risk; controller: PlayerController }) {
  const start = formatMediaTime(risk.firstSeenMs);
  return (
    <li
      className={`flex flex-col gap-1 rounded-lg border-l-4 bg-panel-raised p-2 text-sm ${risk.status === "active" ? "border-danger" : "border-line"}`}
    >
      <p className="flex flex-wrap items-center gap-x-2">
        {/* 구역 없이 영상 전체에 걸린 위험은 zoneId가 global이고 이름이 null이다. */}
        <span className="font-semibold">{risk.zoneName ?? "전체"}</span>
        <span>{eventTypeName(risk.riskType)}</span>
        {risk.carriedOver && (
          <span className="rounded bg-surface px-1.5 text-xs text-muted">이전 영상에서 이어짐</span>
        )}
      </p>
      <p className="text-muted">{risk.reason}</p>
      <p className="flex flex-wrap items-center gap-x-3 text-xs">
        <button
          type="button"
          aria-label={`시작 ${start}로 이동`}
          onClick={() => {
            controller.seek(risk.firstSeenMs);
          }}
          className="font-mono text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          시작 {start}
        </button>
        <span className="font-mono">
          해소 {risk.resolvedAtMs === null ? "-" : formatMediaTime(risk.resolvedAtMs)}
        </span>
        <span>
          노출 {risk.exposure.exposureCount}명 · {risk.exposure.exposureSeconds}초
        </span>
      </p>
    </li>
  );
}
