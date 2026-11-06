import { formatMediaTime } from "../../../shared/lib/format";
import { Panel } from "../../../shared/ui/Panel";
import { useSourceSnapshots } from "../api/useSourceSnapshots";
import { AnalysisError } from "./AnalysisError";

export interface SnapshotListProps {
  sourceId: string;
  /** 관련 이벤트를 연다(R-5와 같은 동작) */
  onOpenEvent: (eventId: string) => void;
}

/** 상태 스냅샷(SPEC-031 R-10). 시각 순으로 "구역: 이전 → 현재"를 보인다. */
export function SnapshotList({ sourceId, onOpenEvent }: SnapshotListProps) {
  const { data, error, isPending, refetch } = useSourceSnapshots(sourceId);
  // 계약은 timestampMs 순이지만, 화면 순서가 서버 정렬에 기대지 않게 한 번 더 정렬한다.
  const items =
    data === undefined ? [] : data.items.toSorted((a, b) => a.timestampMs - b.timestampMs);
  return (
    <Panel title="상태 스냅샷">
      {isPending ? (
        <p className="text-sm text-muted">상태 스냅샷을 불러오는 중입니다.</p>
      ) : error !== null ? (
        <AnalysisError
          error={error}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">상태 스냅샷이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((snapshot) => (
            <li
              key={snapshot.snapshotId}
              className="flex flex-wrap items-center gap-x-2 rounded-lg bg-panel-raised px-2 py-1.5"
            >
              <span>
                <span className="font-mono text-muted">
                  {formatMediaTime(snapshot.timestampMs)}
                </span>
                {" · "}
                <span className="font-semibold">{snapshot.zoneName ?? "전체"}</span>
                {": "}
                {snapshot.previousState ?? "-"} → {snapshot.currentState ?? "-"}
              </span>
              <button
                type="button"
                aria-label={`${formatMediaTime(snapshot.timestampMs)} 관련 이벤트 보기`}
                onClick={() => {
                  onOpenEvent(snapshot.relatedEventId);
                }}
                className="ml-auto text-xs text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                관련 이벤트 보기
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
