import { z } from "zod";
import { eventTypeSchema, reviewStatusSchema } from "./schemas";
import { REVIEW_REASON_FILTERS } from "./reviewReason";

/** 검토 큐 거르기 조건. URL 쿼리에 두어 뒤로 가기와 "저장 후 다음"(R-6)이 같은 조건을 쓴다. */
export interface ReviewQuery {
  status?: z.infer<typeof reviewStatusSchema>;
  reason?: (typeof REVIEW_REASON_FILTERS)[number];
  eventType?: z.infer<typeof eventTypeSchema>;
}

const pageSchema = z.coerce.number().int().min(0).catch(0);

// URL은 사용자가 바꿀 수 있는 외부 입력이라 알려진 값만 받고 나머지는 거르지 않은 것으로 본다.
function pick<T>(schema: z.ZodType<T>, value: string | null): T | undefined {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

/** URL 쿼리에서 거르기 조건과 쪽 번호를 읽는다. 상태를 고르지 않으면 기본은 `UNASSIGNED`다. */
export function readReviewQuery(params: URLSearchParams): { query: ReviewQuery; page: number } {
  const status = params.get("status");
  return {
    query: {
      status: status === "all" ? undefined : (pick(reviewStatusSchema, status) ?? "UNASSIGNED"),
      reason: pick(z.enum(REVIEW_REASON_FILTERS), params.get("reason")),
      eventType: pick(eventTypeSchema, params.get("eventType")),
    },
    page: pageSchema.parse(params.get("page") ?? 0),
  };
}

/** 거르기 조건을 URL 쿼리 문자열로 만든다. 상세로 갈 때 붙여 "저장 후 다음"이 같은 조건을 쓰게 한다. */
export function reviewQueryString(query: ReviewQuery): string {
  const params = new URLSearchParams();
  params.set("status", query.status ?? "all");
  if (query.reason !== undefined) {
    params.set("reason", query.reason);
  }
  if (query.eventType !== undefined) {
    params.set("eventType", query.eventType);
  }
  return params.toString();
}
