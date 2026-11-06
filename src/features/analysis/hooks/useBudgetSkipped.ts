import { useSourceEvents } from "../api/useSourceEvents";
import { countBudgetSkipped } from "../model/eventFilters";

/**
 * 예산·상한 초과로 판정하지 않은 이벤트 수(SPEC-031 R-23). 화면의 첫 쪽이 아니라 `unverified`만 따로 읽어 센다.
 * 요약 응답에 이 개수가 없어(계약 변경 필요) 첫 쪽(100건)까지만 세고, 더 있으면 `more`로 알린다.
 */
export function useBudgetSkipped(sourceId: string): { count: number; more: boolean } | undefined {
  const { data, hasNextPage } = useSourceEvents(sourceId, { verificationStatus: "unverified" });
  const first = data?.pages[0];
  return first === undefined
    ? undefined
    : { count: countBudgetSkipped(first.items), more: hasNextPage };
}
