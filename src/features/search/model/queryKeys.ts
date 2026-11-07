import type { TextSearchCriteria } from "./searchParams";

export const searchQueryKeys = {
  all: ["search"] as const,
  moments: (criteria: TextSearchCriteria) => [...searchQueryKeys.all, "moments", criteria] as const,
  /** 마지막 이미지 검색 결과. 파일을 URL에 담을 수 없어 메모리 캐시에만 둔다(SPEC-033 R-12). */
  lastImage: () => [...searchQueryKeys.all, "last-image"] as const,
  grounding: (groundingId: string) => [...searchQueryKeys.all, "grounding", groundingId] as const,
  groundingClip: (groundingId: string) =>
    [...searchQueryKeys.grounding(groundingId), "clip"] as const,
};
