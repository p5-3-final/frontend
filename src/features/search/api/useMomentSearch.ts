import { skipToken, useQuery } from "@tanstack/react-query";
import { searchQueryKeys } from "../model/queryKeys";
import type { TextSearchCriteria } from "../model/searchParams";
import { searchAllMoments, searchSourceMoments } from "./searchApi";

// 영상 상세에 갔다 돌아올 때 같은 조건이면 다시 묻지 않는다(SPEC-033 R-12).
const SEARCH_GC_MS = 30 * 60 * 1000;

/**
 * 문장 검색(searchSourceMoments·searchAllMoments). 조건은 URL에서 읽은 값이다.
 * 정밀 검색은 사용자별 상한이 있어 자동으로 다시 묻지 않는다(창 포커스·재시도 없음).
 */
export function useMomentSearch(criteria: TextSearchCriteria | undefined) {
  return useQuery({
    queryKey:
      criteria === undefined
        ? [...searchQueryKeys.all, "moments"]
        : searchQueryKeys.moments(criteria),
    queryFn:
      criteria === undefined
        ? skipToken
        : () =>
            criteria.scope === "source"
              ? searchSourceMoments(criteria.sourceId, criteria.q, criteria.precise)
              : searchAllMoments(criteria.q),
    staleTime: Infinity,
    gcTime: SEARCH_GC_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
