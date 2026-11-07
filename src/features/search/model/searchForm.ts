import { z } from "zod";
import { SEARCH_QUERY_MESSAGE, SEARCH_SOURCE_REQUIRED_MESSAGE } from "../../../shared/lib/messages";
import { QUERY_MAX_LENGTH, type SearchCriteria, type TextSearchCriteria } from "./searchParams";

/** 문장 검색 폼 값. 범위가 "내 영상 전체"면 정밀 검색은 보내지 않는다(SPEC-033 R-7). */
export const searchFormSchema = z
  .object({
    q: z.string().trim().min(1, SEARCH_QUERY_MESSAGE).max(QUERY_MAX_LENGTH, SEARCH_QUERY_MESSAGE),
    scope: z.enum(["source", "all"]),
    sourceId: z.string(),
    precise: z.boolean(),
  })
  .refine((values) => values.scope === "all" || z.guid().safeParse(values.sourceId).success, {
    path: ["sourceId"],
    message: SEARCH_SOURCE_REQUIRED_MESSAGE,
  });
export type SearchFormValues = z.infer<typeof searchFormSchema>;

/** 검증을 통과한 폼 값을 검색 조건으로 바꾼다. */
export function toCriteria(values: SearchFormValues): TextSearchCriteria {
  return values.scope === "source"
    ? {
        kind: "text",
        q: values.q,
        scope: "source",
        sourceId: values.sourceId,
        precise: values.precise,
      }
    : { kind: "text", q: values.q, scope: "all", precise: false };
}

/** URL 조건으로 폼의 처음 값을 정한다. 조건이 없어도 `sourceId`가 있으면(영상 상세에서 온 경우) 그 영상 범위로 연다. */
export function initialFormValues(
  criteria: SearchCriteria | undefined,
  params: URLSearchParams,
): SearchFormValues {
  if (criteria?.kind === "text") {
    return {
      q: criteria.q,
      scope: criteria.scope,
      sourceId: criteria.scope === "source" ? criteria.sourceId : "",
      precise: criteria.precise,
    };
  }
  const sourceId = z.guid().safeParse(params.get("sourceId"));
  return sourceId.success
    ? { q: "", scope: "source", sourceId: sourceId.data, precise: false }
    : { q: "", scope: "all", sourceId: "", precise: false };
}
