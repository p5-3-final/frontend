import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useMe } from "../../../auth";
import { ApiError } from "../../../../shared/api/problem";
import { formatDateTime, formatMediaTime } from "../../../../shared/lib/format";
import { eventTypeName, messageForCode } from "../../../../shared/lib/messages";
import { Alert } from "../../../../shared/ui/Alert";
import { Button } from "../../../../shared/ui/Button";
import { ConfirmDialog } from "../../../../shared/ui/ConfirmDialog";
import { Panel } from "../../../../shared/ui/Panel";
import {
  useDeleteGoldenSetEntry,
  useFreezeGoldenSet,
  useGoldenSet,
  useGoldenSetEntries,
  useGoldenSetVersions,
} from "../../api/goldenSets";
import { ORIGIN_NAMES, SPLIT_NAMES, VERDICT_NAMES } from "../../model/names";
import type { GoldenSet } from "../../model/schemas";
import { Cell, DataTable } from "../../ui/DataTable";
import { TextLink } from "../../ui/TextLink";
import { QualityError } from "../QualityError";

function codeMessage(error: Error | null): string | undefined {
  return error === null
    ? undefined
    : messageForCode(error instanceof ApiError ? error.code : undefined);
}

function Drafts({ setId }: { setId: string }) {
  const entries = useGoldenSetEntries(setId);
  const remove = useDeleteGoldenSetEntry(setId);
  if (entries.isPending) {
    return <p role="status">초안 항목을 불러오는 중입니다.</p>;
  }
  if (entries.isError) {
    return (
      <QualityError
        error={entries.error}
        onRetry={() => {
          void entries.refetch();
        }}
      />
    );
  }
  if (entries.data.items.length === 0) {
    return <p className="text-sm text-muted">초안 항목이 없습니다.</p>;
  }
  return (
    <>
      {remove.error !== null && <Alert>{codeMessage(remove.error)}</Alert>}
      <DataTable label="초안 항목" columns={["판정", "이벤트", "구간", "넣은 시각", ""]}>
        {entries.data.items.map((entry) => (
          <tr key={entry.entryId}>
            <Cell>{VERDICT_NAMES[entry.label.verdict]}</Cell>
            <Cell>
              {entry.label.eventPresent && entry.label.eventType !== null
                ? eventTypeName(entry.label.eventType)
                : "이벤트 없음"}
            </Cell>
            <Cell>
              {entry.label.startMs === null || entry.label.endMs === null
                ? "-"
                : `${formatMediaTime(entry.label.startMs)} ~ ${formatMediaTime(entry.label.endMs)}`}
            </Cell>
            <Cell>{formatDateTime(entry.addedAt)}</Cell>
            <Cell>
              <Button
                variant="secondary"
                disabled={remove.isPending}
                onClick={() => {
                  remove.mutate(entry.entryId);
                }}
              >
                빼기
              </Button>
            </Cell>
          </tr>
        ))}
      </DataTable>
    </>
  );
}

function Versions({ setId }: { setId: string }) {
  const versions = useGoldenSetVersions(setId);
  const { data: me } = useMe();
  if (versions.isPending) {
    return <p role="status">확정 버전을 불러오는 중입니다.</p>;
  }
  if (versions.isError) {
    return (
      <QualityError
        error={versions.error}
        onRetry={() => {
          void versions.refetch();
        }}
      />
    );
  }
  if (versions.data.items.length === 0) {
    return <p className="text-sm text-muted">확정한 버전이 없습니다.</p>;
  }
  return (
    <DataTable
      label="확정 버전"
      columns={["버전", "항목 수", "매니페스트 경로", "확정 시각", "확정한 사람"]}
    >
      {versions.data.items.map((version) => (
        <tr key={version.version}>
          <Cell>v{version.version}</Cell>
          <Cell numeric>{version.entryCount}</Cell>
          <Cell>
            <code className="text-xs break-all">{version.manifestKey}</code>
          </Cell>
          <Cell>{formatDateTime(version.frozenAt)}</Cell>
          <Cell>{version.frozenBy === me?.id ? "나" : "다른 운영자"}</Cell>
        </tr>
      ))}
    </DataTable>
  );
}

function Freeze({ set }: { set: GoldenSet }) {
  const freeze = useFreezeGoldenSet(set.setId);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={() => {
          freeze.reset();
          setConfirming(true);
        }}
      >
        버전 확정
      </Button>
      {freeze.data !== undefined && (
        <Alert tone="success">
          v{freeze.data.version}를 확정했습니다. 매니페스트: {freeze.data.manifestKey}
        </Alert>
      )}
      {confirming && (
        <ConfirmDialog
          title="버전 확정"
          confirmLabel="확정"
          pending={freeze.isPending}
          error={codeMessage(freeze.error)}
          onCancel={() => {
            setConfirming(false);
          }}
          onConfirm={() => {
            freeze.mutate(undefined, {
              onSuccess: () => {
                setConfirming(false);
              },
            });
          }}
        >
          초안 항목 {set.draftEntryCount}개를 새 버전으로 확정합니다. 확정한 버전은 바꿀 수
          없습니다.
        </ConfirmDialog>
      )}
    </div>
  );
}

/** Golden Set 상세(SPEC-035 R-10). 초안 항목, 확정 버전, 버전 확정 */
export function GoldenSetDetail() {
  const { setId = "" } = useParams();
  const set = useGoldenSet(setId);
  const back = (
    <Link
      to="/quality/golden-sets"
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Golden Set 목록으로
    </Link>
  );
  if (set.isPending) {
    return <p role="status">Golden Set을 불러오는 중입니다.</p>;
  }
  if (set.isError) {
    return (
      <div className="flex flex-col gap-3">
        {back}
        <QualityError
          error={set.error}
          onRetry={() => {
            void set.refetch();
          }}
        />
      </div>
    );
  }
  const data = set.data;
  return (
    <section aria-labelledby="golden-set-heading" className="flex flex-col gap-4">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="golden-set-heading" className="text-lg font-semibold">
            {data.name}
          </h2>
          <p className="flex flex-wrap gap-x-3 text-sm text-muted">
            <span>{SPLIT_NAMES[data.split]}</span>
            <span>출처 {ORIGIN_NAMES[data.origin]}</span>
            <span>초안 {data.draftEntryCount}개</span>
            <span>
              {data.latestVersion === null
                ? "확정 버전 없음"
                : `최신 v${String(data.latestVersion)}`}
            </span>
          </p>
          {data.baselineRunId !== null && (
            <TextLink to={`/quality/runs/${data.baselineRunId}`}>기준 실행</TextLink>
          )}
        </div>
        {data.origin === "review" && <Freeze set={data} />}
      </div>
      <Panel title="초안 항목">
        <Drafts setId={setId} />
      </Panel>
      <Panel title="확정 버전">
        <Versions setId={setId} />
      </Panel>
    </section>
  );
}
