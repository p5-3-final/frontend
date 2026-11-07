import { useState } from "react";
import { formatDateTime } from "../../../../shared/lib/format";
import { Pagination } from "../../../../shared/ui/Pagination";
import { useDatasetImports } from "../../api/datasets";
import { IMPORT_STATUS_NAMES } from "../../model/names";
import { Cell, DataTable } from "../../ui/DataTable";
import { TextLink } from "../../ui/TextLink";
import { QualityError } from "../QualityError";

const COLUMNS = ["매니페스트", "데이터셋", "상태", "등록/영상", "실패", "접수 시각", ""] as const;

/** 가져오기 목록(SPEC-035 R-17). 진행 중인 가져오기가 있는 동안 5초마다 상태를 다시 받는다. */
export function DatasetImports() {
  const [page, setPage] = useState(0);
  const imports = useDatasetImports(page);
  if (imports.isPending) {
    return <p role="status">가져오기 목록을 불러오는 중입니다.</p>;
  }
  if (imports.isError) {
    return (
      <QualityError
        error={imports.error}
        onRetry={() => {
          void imports.refetch();
        }}
      />
    );
  }
  if (imports.data.items.length === 0) {
    return <p className="text-sm text-muted">가져오기 기록이 없습니다.</p>;
  }
  return (
    <>
      <DataTable label="가져오기 목록" columns={COLUMNS}>
        {imports.data.items.map((entry) => (
          <tr key={entry.importId} aria-label={entry.manifestKey}>
            <Cell>
              <code className="text-xs break-all">{entry.manifestKey}</code>
            </Cell>
            <Cell>{entry.datasetName ?? "-"}</Cell>
            <Cell>{IMPORT_STATUS_NAMES[entry.status]}</Cell>
            <Cell numeric>
              {entry.counts.registered}/{entry.counts.videos}
            </Cell>
            <Cell numeric>{entry.counts.failed}</Cell>
            <Cell>{formatDateTime(entry.createdAt)}</Cell>
            <Cell>
              <TextLink to={`/quality/datasets/imports/${entry.importId}`}>
                상세<span className="sr-only"> {entry.manifestKey}</span>
              </TextLink>
            </Cell>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} totalPages={imports.data.page.totalPages} onChange={setPage} />
    </>
  );
}
