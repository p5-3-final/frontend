import { FlaskConical } from "lucide-react";
import { useSearchParams } from "react-router";
import { formatDateTime } from "../../../../shared/lib/format";
import { EmptyState } from "../../../../shared/ui/EmptyState";
import { Pagination } from "../../../../shared/ui/Pagination";
import { useGoldenSets } from "../../api/goldenSets";
import { useEvaluationRuns } from "../../api/runs";
import { gateOutcome } from "../../model/gate";
import { RUN_KIND_NAMES, RUN_TRIGGER_NAMES } from "../../model/names";
import { Cell, DataTable } from "../../ui/DataTable";
import { SelectField } from "../../ui/SelectField";
import { TextLink } from "../../ui/TextLink";
import { QualityError } from "../QualityError";
import { GateBadge } from "./GateBadge";

const COLUMNS = ["받은 시각", "Golden Set", "버전", "종류", "트리거", "Gate"] as const;

/** 평가 실행 목록(SPEC-035 R-12). Golden Set 거르기와 쪽 번호는 URL에 둔다. */
export function EvaluationRunList() {
  const [params, setParams] = useSearchParams();
  const sets = useGoldenSets();
  const setIds = new Set(sets.data?.items.map((set) => set.setId) ?? []);
  const requested = params.get("goldenSetId") ?? undefined;
  // URL은 외부 입력이라 목록을 받은 뒤에는 아는 세트만 거르기로 쓴다.
  const goldenSetId =
    requested !== undefined && (sets.data === undefined || setIds.has(requested))
      ? requested
      : undefined;
  const page = Math.max(0, Number.parseInt(params.get("page") ?? "0", 10) || 0);
  const runs = useEvaluationRuns(goldenSetId, page);
  const setName = (setId: string) =>
    sets.data?.items.find((set) => set.setId === setId)?.name ?? setId.slice(0, 8);

  const update = (next: { goldenSetId?: string; page?: number }) => {
    const search = new URLSearchParams();
    if (next.goldenSetId !== undefined) {
      search.set("goldenSetId", next.goldenSetId);
    }
    if (next.page !== undefined && next.page > 0) {
      search.set("page", String(next.page));
    }
    setParams(search);
  };

  return (
    <section aria-labelledby="runs-heading" className="flex flex-col gap-4">
      <h2 id="runs-heading" className="text-lg font-semibold">
        평가 실행
      </h2>
      <div className="max-w-sm">
        <SelectField
          label="Golden Set"
          options={[
            { value: "", label: "전체" },
            ...(sets.data?.items.map((set) => ({ value: set.setId, label: set.name })) ?? []),
          ]}
          value={goldenSetId ?? ""}
          onChange={(event) => {
            update({ goldenSetId: event.target.value === "" ? undefined : event.target.value });
          }}
        />
      </div>
      {runs.isPending && <p role="status">평가 실행을 불러오는 중입니다.</p>}
      {runs.isError && (
        <QualityError
          error={runs.error}
          onRetry={() => {
            void runs.refetch();
          }}
        />
      )}
      {runs.data?.items.length === 0 && (
        <EmptyState icon={FlaskConical} message="평가 실행이 없습니다." />
      )}
      {runs.data !== undefined && runs.data.items.length > 0 && (
        <>
          <DataTable label="평가 실행 목록" columns={COLUMNS}>
            {runs.data.items.map((run) => (
              <tr key={run.runId}>
                <Cell>
                  <TextLink to={`/quality/runs/${run.runId}`}>
                    {formatDateTime(run.receivedAt)}
                    <span className="sr-only"> 상세</span>
                  </TextLink>
                </Cell>
                <Cell>{setName(run.goldenSetId)}</Cell>
                <Cell>v{run.goldenSetVersion}</Cell>
                <Cell>{RUN_KIND_NAMES[run.kind]}</Cell>
                <Cell>{RUN_TRIGGER_NAMES[run.trigger]}</Cell>
                <Cell>
                  <GateBadge outcome={gateOutcome(run)} />
                </Cell>
              </tr>
            ))}
          </DataTable>
          <Pagination
            page={page}
            totalPages={runs.data.page.totalPages}
            onChange={(next) => {
              update({ goldenSetId, page: next });
            }}
          />
        </>
      )}
    </section>
  );
}
