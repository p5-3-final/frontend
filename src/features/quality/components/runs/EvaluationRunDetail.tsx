import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";
import { ApiError } from "../../../../shared/api/problem";
import { formatDateTime } from "../../../../shared/lib/format";
import { eventTypeName, messageForCode } from "../../../../shared/lib/messages";
import { Alert } from "../../../../shared/ui/Alert";
import { Button } from "../../../../shared/ui/Button";
import { Panel } from "../../../../shared/ui/Panel";
import { useGoldenSets, useSetBaseline } from "../../api/goldenSets";
import { useEvaluationRun } from "../../api/runs";
import {
  failureRows,
  formatDiff,
  formatMetric,
  gateOutcome,
  sortedMetrics,
} from "../../model/gate";
import { RUN_KIND_NAMES, RUN_TRIGGER_NAMES } from "../../model/names";
import { RUN_VERSION_KEYS, type EvaluationRun } from "../../model/schemas";
import { Cell, DataTable } from "../../ui/DataTable";
import { TextLink } from "../../ui/TextLink";
import { QualityError } from "../QualityError";
import { GateBadge } from "./GateBadge";

const NOT_IN_RUN = "이번 실행에 없음";

function typeName(eventType: string | null): string {
  return eventType === null ? "전체" : eventTypeName(eventType);
}

function Failures({ run }: { run: EvaluationRun }) {
  const rows = failureRows(run.gate.failures);
  return (
    <section
      aria-labelledby="gate-failures-heading"
      className="flex flex-col gap-3 rounded-xl border border-danger/50 bg-danger-soft/40 p-4"
    >
      <h3 id="gate-failures-heading" className="font-semibold text-danger">
        실패 지표 (허용 하락폭 {formatMetric(run.gate.tolerance)})
      </h3>
      <DataTable label="실패 지표" columns={["이름", "유형", "기준값", "실행값", "차이"]}>
        {rows.map((row) => (
          <tr key={`${row.name}-${row.eventType ?? ""}`}>
            <Cell>{row.name}</Cell>
            <Cell>{typeName(row.eventType)}</Cell>
            <Cell numeric>{formatMetric(row.baseline)}</Cell>
            <Cell numeric>{row.value === null ? NOT_IN_RUN : formatMetric(row.value)}</Cell>
            <Cell numeric>
              <span className="font-semibold text-danger">{formatDiff(row.diff)}</span>
            </Cell>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}

function Baseline({ run }: { run: EvaluationRun }) {
  const sets = useGoldenSets();
  const setBaseline = useSetBaseline();
  const set = sets.data?.items.find((entry) => entry.setId === run.goldenSetId);
  if (set === undefined) {
    return null;
  }
  if (set.baselineRunId === run.runId) {
    return (
      <div className="flex flex-col items-end gap-2">
        {setBaseline.isSuccess && (
          <Alert tone="success">{set.name}의 기준 실행으로 지정했습니다.</Alert>
        )}
        <span className="text-sm font-semibold text-accent">현재 기준 실행</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="secondary"
        disabled={setBaseline.isPending}
        onClick={() => {
          setBaseline.mutate({ setId: set.setId, runId: run.runId });
        }}
      >
        기준으로 지정
      </Button>
      {setBaseline.error !== null && (
        <Alert>
          {messageForCode(
            setBaseline.error instanceof ApiError ? setBaseline.error.code : undefined,
          )}
        </Alert>
      )}
    </div>
  );
}

/** 평가 실행 상세(SPEC-035 R-11, R-13). Gate가 실패하면 실패 지표를 맨 위에 강조한다(US-3). */
export function EvaluationRunDetail() {
  const { runId = "" } = useParams();
  const run = useEvaluationRun(runId);
  const back = (
    <Link
      to="/quality/runs"
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      평가 실행 목록으로
    </Link>
  );
  if (run.isPending) {
    return <p role="status">평가 실행을 불러오는 중입니다.</p>;
  }
  if (run.isError) {
    return (
      <div className="flex flex-col gap-3">
        {back}
        <QualityError
          error={run.error}
          onRetry={() => {
            void run.refetch();
          }}
        />
      </div>
    );
  }
  const data = run.data;
  const outcome = gateOutcome(data);
  return (
    <section aria-labelledby="run-heading" className="flex flex-col gap-4">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="run-heading" className="flex items-center gap-2 text-lg font-semibold">
            평가 실행 <GateBadge outcome={outcome} prefix="Gate " />
          </h2>
          <p className="text-sm text-muted">
            {RUN_KIND_NAMES[data.kind]} · {RUN_TRIGGER_NAMES[data.trigger]} · Golden Set v
            {data.goldenSetVersion} · 받은 시각 {formatDateTime(data.receivedAt)}
          </p>
          {data.gate.baselineRunId === null ? (
            <p className="text-sm">기준 실행 없음</p>
          ) : (
            <TextLink to={`/quality/runs/${data.gate.baselineRunId}`}>비교한 기준 실행</TextLink>
          )}
        </div>
        <Baseline run={data} />
      </div>
      {outcome === "failed" && <Failures run={data} />}
      <Panel title="버전">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {RUN_VERSION_KEYS.map((key) => (
            <div key={key} className="contents">
              <dt className="text-muted">{key}</dt>
              <dd className="break-all">{data.versions[key] ?? "-"}</dd>
            </div>
          ))}
          <dt className="text-muted">commitSha</dt>
          <dd>{data.commitSha ?? "-"}</dd>
        </dl>
      </Panel>
      <DataTable label="전체 지표" columns={["이름", "유형", "값", "방향"]}>
        {sortedMetrics(data.metrics).map((metric) => (
          <tr key={`${metric.name}-${metric.eventType ?? ""}`}>
            <Cell>{metric.name}</Cell>
            <Cell>{typeName(metric.eventType)}</Cell>
            <Cell numeric>{formatMetric(metric.value)}</Cell>
            <Cell>{metric.higherIsBetter ? "높을수록 좋음" : "낮을수록 좋음"}</Cell>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
