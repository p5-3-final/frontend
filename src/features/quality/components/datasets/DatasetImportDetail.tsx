import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";
import { formatDateTime } from "../../../../shared/lib/format";
import { Panel } from "../../../../shared/ui/Panel";
import { useDatasetImport } from "../../api/datasets";
import { IMPORT_STATUS_NAMES, SPLIT_NAMES } from "../../model/names";
import type { DatasetImport } from "../../model/schemas";
import { Cell, DataTable } from "../../ui/DataTable";
import { TextLink } from "../../ui/TextLink";
import { QualityError } from "../QualityError";

const COUNT = new Intl.NumberFormat("ko-KR");

function Counts({ counts }: { counts: DatasetImport["counts"] }) {
  const items = [
    ["영상", counts.videos],
    ["등록", counts.registered],
    ["실패", counts.failed],
    ["라벨", counts.labels],
    ["dev", counts.dev],
    ["eval", counts.eval],
  ] as const;
  return (
    <Panel title="개수">
      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-panel-raised px-3 py-2">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{COUNT.format(value)}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function GoldenSets({ goldenSets }: { goldenSets: DatasetImport["goldenSets"] }) {
  if (goldenSets === null) {
    return <p className="text-sm text-muted">아직 만든 Golden Set이 없습니다.</p>;
  }
  const links = [
    { split: "dev", setId: goldenSets.devSetId, version: goldenSets.devVersion },
    { split: "eval", setId: goldenSets.evalSetId, version: goldenSets.evalVersion },
  ] as const;
  return (
    <ul className="flex flex-wrap gap-4">
      {links.map((link) => (
        <li key={link.split}>
          <TextLink to={`/quality/golden-sets/${link.setId}`}>
            {SPLIT_NAMES[link.split]}{" "}
            {link.version === null ? "확정 전" : `v${String(link.version)}`}
          </TextLink>
        </li>
      ))}
    </ul>
  );
}

/** 가져오기 상세(SPEC-035 R-18). 진행 중이면 5초마다 다시 받는다(R-17). */
export function DatasetImportDetail() {
  const { importId = "" } = useParams();
  const detail = useDatasetImport(importId);
  const back = (
    <Link
      to="/quality/datasets"
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      데이터셋으로
    </Link>
  );
  if (detail.isPending) {
    return <p role="status">가져오기를 불러오는 중입니다.</p>;
  }
  if (detail.isError) {
    return (
      <div className="flex flex-col gap-3">
        {back}
        <QualityError
          error={detail.error}
          onRetry={() => {
            void detail.refetch();
          }}
        />
      </div>
    );
  }
  const data = detail.data;
  return (
    <section aria-labelledby="import-heading" className="flex flex-col gap-4">
      {back}
      <div>
        <h2 id="import-heading" className="text-lg font-semibold">
          {data.datasetName ?? "데이터셋 이름 확인 전"}
        </h2>
        <p className="flex flex-wrap gap-x-3 text-sm text-muted">
          <span className="font-semibold text-content">{IMPORT_STATUS_NAMES[data.status]}</span>
          <code className="break-all">{data.manifestKey}</code>
          <span>평가 비율 {data.evalRatio}</span>
          <span>분할 시드 {data.splitSeed}</span>
          <span>접수 {formatDateTime(data.createdAt)}</span>
          {data.finishedAt !== null && <span>완료 {formatDateTime(data.finishedAt)}</span>}
        </p>
      </div>
      <Counts counts={data.counts} />
      <Panel title="만든 Golden Set">
        <GoldenSets goldenSets={data.goldenSets} />
      </Panel>
      <Panel title="오류">
        {data.errors.length === 0 ? (
          <p className="text-sm text-muted">오류가 없습니다.</p>
        ) : (
          <DataTable label="오류 목록" columns={["외부 ID", "code", "내용"]}>
            {data.errors.map((error, index) => (
              <tr key={`${error.externalId ?? ""}-${String(index)}`}>
                <Cell>{error.externalId ?? "-"}</Cell>
                <Cell>
                  <code className="text-xs">{error.code}</code>
                </Cell>
                <Cell>{error.message}</Cell>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </section>
  );
}
