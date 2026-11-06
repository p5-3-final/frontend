import type { z } from "zod";
import {
  eventTypeSchema,
  reviewStateSchema,
  severitySchema,
  verificationStatusSchema,
  type EventType,
  type ReviewState,
  type Severity,
  type VerificationStatus,
} from "./schemas";

/** 영상 이벤트 목록 거르기(listSourceEvents 쿼리) */
export interface EventQuery {
  eventType?: EventType;
  severity?: Severity;
  verificationStatus?: VerificationStatus;
  reviewState?: ReviewState;
}

/** 전체 이벤트 목록 거르기(listMyEvents 쿼리). `from`·`to`는 ISO 시각이다. */
export interface MyEventQuery extends EventQuery {
  from?: string;
  to?: string;
}

// URL 쿼리 이름. 주소를 짧게 두려고 API 쿼리 이름과 다르게 쓴다(plan 4절).
const URL_KEYS = {
  eventType: "type",
  severity: "severity",
  verificationStatus: "verification",
  reviewState: "review",
} as const satisfies Record<keyof EventQuery, string>;

function read<T>(params: URLSearchParams, key: string, schema: z.ZodType<T>): T | undefined {
  const parsed = schema.safeParse(params.get(key));
  return parsed.success ? parsed.data : undefined;
}

/** 값이 있는 키만 남긴다. query key와 URL이 고르지 않은 거르기를 `undefined` 키로 갖지 않게 한다. */
function definedEntries(query: EventQuery): [keyof typeof URL_KEYS, string][] {
  const entries: [keyof typeof URL_KEYS, string | undefined][] = [
    ["eventType", query.eventType],
    ["severity", query.severity],
    ["verificationStatus", query.verificationStatus],
    ["reviewState", query.reviewState],
  ];
  return entries.flatMap(([field, value]) => (value === undefined ? [] : [[field, value]]));
}

/** URL 쿼리에서 거르기 값을 읽는다. 사용자가 바꿀 수 있는 입력이라 모르는 값은 버린다. */
export function parseEventQuery(params: URLSearchParams): EventQuery {
  const eventType = read(params, URL_KEYS.eventType, eventTypeSchema);
  const severity = read(params, URL_KEYS.severity, severitySchema);
  const verificationStatus = read(params, URL_KEYS.verificationStatus, verificationStatusSchema);
  const reviewState = read(params, URL_KEYS.reviewState, reviewStateSchema);
  return {
    ...(eventType === undefined ? {} : { eventType }),
    ...(severity === undefined ? {} : { severity }),
    ...(verificationStatus === undefined ? {} : { verificationStatus }),
    ...(reviewState === undefined ? {} : { reviewState }),
  };
}

/** 거르기 값을 URL 쿼리에 쓴다. 거르기와 상관없는 쿼리(`event`, `t` 등)는 그대로 둔다. */
export function toEventSearchParams(params: URLSearchParams, query: EventQuery): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of Object.values(URL_KEYS)) {
    next.delete(key);
  }
  for (const [field, value] of definedEntries(query)) {
    next.set(URL_KEYS[field], value);
  }
  return next;
}
