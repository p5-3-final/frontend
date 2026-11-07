import { skipToken, useQuery } from "@tanstack/react-query";
import { searchQueryKeys } from "../model/queryKeys";
import type { MomentSearchResult } from "../model/schemas";

// 문장 검색 결과와 같이 30분 둔다. 새로고침하면 사라지고 다시 올리라고 안내한다.
const LAST_IMAGE_GC_MS = 30 * 60 * 1000;

/** 마지막 이미지 검색 결과. 묻지 않고 {@link useImageSearch}가 넣은 캐시만 읽는다. */
export function useLastImageSearch() {
  return useQuery<MomentSearchResult>({
    queryKey: searchQueryKeys.lastImage(),
    queryFn: skipToken,
    gcTime: LAST_IMAGE_GC_MS,
  });
}
