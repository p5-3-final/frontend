import { useInfiniteQuery } from "@tanstack/react-query";
import type { EventQuery } from "../model/eventFilters";
import { analysisQueryKeys } from "../model/queryKeys";
import { listSourceEvents } from "./analysisApi";

/**
 * 영상 이벤트 목록(listSourceEvents). 첫 쪽(100건)을 받고 "더 보기"로 다음 쪽을 받는다.
 * 서명 주소(썸네일)가 들어 있어 화면을 떠나면 바로 버린다(NFR-3).
 */
export function useSourceEvents(sourceId: string, query: EventQuery) {
  return useInfiniteQuery({
    queryKey: analysisQueryKeys.sourceEvents(sourceId, query),
    queryFn: ({ pageParam }) => listSourceEvents(sourceId, query, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page.page + 1 < last.page.totalPages ? last.page.page + 1 : undefined,
    gcTime: 0,
  });
}
