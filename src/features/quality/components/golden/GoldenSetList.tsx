import { Database } from "lucide-react";
import { EmptyState } from "../../../../shared/ui/EmptyState";
import { useGoldenSets } from "../../api/goldenSets";
import { ORIGIN_NAMES, SPLIT_NAMES } from "../../model/names";
import { Cell, DataTable } from "../../ui/DataTable";
import { TextLink } from "../../ui/TextLink";
import { QualityError } from "../QualityError";
import { CreateGoldenSetForm } from "./CreateGoldenSetForm";

const COLUMNS = ["이름", "분할", "출처", "초안 수", "최신 버전", "기준 실행"] as const;

/** Golden Set 목록과 만들기(SPEC-035 R-8) */
export function GoldenSetList() {
  const sets = useGoldenSets();
  return (
    <section aria-labelledby="golden-sets-heading" className="flex flex-col gap-4">
      <h2 id="golden-sets-heading" className="text-lg font-semibold">
        Golden Set
      </h2>
      <CreateGoldenSetForm />
      {sets.isPending && <p role="status">Golden Set을 불러오는 중입니다.</p>}
      {sets.isError && (
        <QualityError
          error={sets.error}
          onRetry={() => {
            void sets.refetch();
          }}
        />
      )}
      {sets.data?.items.length === 0 && (
        <EmptyState icon={Database} message="Golden Set이 없습니다." />
      )}
      {sets.data !== undefined && sets.data.items.length > 0 && (
        <DataTable label="Golden Set 목록" columns={COLUMNS}>
          {sets.data.items.map((set) => (
            <tr key={set.setId}>
              <Cell>
                <TextLink to={`/quality/golden-sets/${set.setId}`}>{set.name}</TextLink>
                {set.description !== null && (
                  <span className="block text-xs text-muted">{set.description}</span>
                )}
              </Cell>
              <Cell>{SPLIT_NAMES[set.split]}</Cell>
              <Cell>{ORIGIN_NAMES[set.origin]}</Cell>
              <Cell numeric>{set.draftEntryCount}</Cell>
              <Cell>{set.latestVersion === null ? "-" : `v${String(set.latestVersion)}`}</Cell>
              <Cell>
                {set.baselineRunId === null ? (
                  "-"
                ) : (
                  <TextLink to={`/quality/runs/${set.baselineRunId}`}>기준 실행</TextLink>
                )}
              </Cell>
            </tr>
          ))}
        </DataTable>
      )}
    </section>
  );
}
