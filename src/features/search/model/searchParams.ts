import { z } from "zod";

/** 계약 Q 파라미터: 1~200자 */
export const QUERY_MAX_LENGTH = 200;

export const querySchema = z.string().trim().min(1).max(QUERY_MAX_LENGTH);

/**
 * 검색 조건. 문장 검색은 URL 쿼리(`?q=&scope=&sourceId=&precise=1`)에, 이미지 검색은 파일을 URL에 담을 수 없어
 * `?image=last`로 마지막 결과(query 캐시)를 가리킨다(SPEC-033 R-12, NFR-2).
 */
export type SearchCriteria =
  | { kind: "text"; q: string; scope: "source"; sourceId: string; precise: boolean }
  | { kind: "text"; q: string; scope: "all"; precise: false }
  | { kind: "image" };
export type TextSearchCriteria = Extract<SearchCriteria, { kind: "text" }>;

// URL은 사용자가 바꿀 수 있는 입력이라 계약 범위 안의 값만 조건으로 받는다.
const textParamsSchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal("source"),
    q: querySchema,
    sourceId: z.guid(),
    precise: z.literal("1").optional(),
  }),
  z.object({ scope: z.literal("all"), q: querySchema }),
]);

/** URL 쿼리에서 검색 조건을 읽는다. 형식이 틀리면 조건이 없는 것으로 본다. */
export function parseSearchCriteria(params: URLSearchParams): SearchCriteria | undefined {
  if (params.get("image") === "last") {
    return { kind: "image" };
  }
  const parsed = textParamsSchema.safeParse(Object.fromEntries(params));
  if (!parsed.success) {
    return undefined;
  }
  const value = parsed.data;
  return value.scope === "source"
    ? {
        kind: "text",
        q: value.q,
        scope: "source",
        sourceId: value.sourceId,
        precise: value.precise === "1",
      }
    : { kind: "text", q: value.q, scope: "all", precise: false };
}

/** 검색 조건을 URL 쿼리로 바꾼다. */
export function toSearchParams(criteria: SearchCriteria): URLSearchParams {
  if (criteria.kind === "image") {
    return new URLSearchParams({ image: "last" });
  }
  const params = new URLSearchParams({ q: criteria.q, scope: criteria.scope });
  if (criteria.scope === "source") {
    params.set("sourceId", criteria.sourceId);
    if (criteria.precise) {
      params.set("precise", "1");
    }
  }
  return params;
}
