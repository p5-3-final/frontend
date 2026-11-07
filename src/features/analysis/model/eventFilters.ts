import { z } from "zod";
import {
  eventTypeSchema,
  reviewStateSchema,
  severitySchema,
  verificationStatusSchema,
  type EventSummary,
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

/** 전체 이벤트 화면의 URL 상태(SPEC-031 R-11). 날짜는 `YYYY-MM-DD`(서울 날짜)다. */
export interface MyEventFilters {
  query: EventQuery;
  fromDate?: string;
  toDate?: string;
  /** 0부터 센 쪽 번호 */
  page: number;
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const pageSchema = z.coerce.number().int().min(0);
const DAY_MS = 24 * 60 * 60 * 1000;

/** 서울 자정(포함). `<input type="date">` 값은 날짜만이라 서울 시간대로 읽는다. */
function seoulMidnight(date: string): Date {
  return new Date(`${date}T00:00:00+09:00`);
}

export function parseMyEventFilters(params: URLSearchParams): MyEventFilters {
  const fromDate = read(params, "from", dateSchema);
  const toDate = read(params, "to", dateSchema);
  return {
    query: parseEventQuery(params),
    ...(fromDate === undefined ? {} : { fromDate }),
    ...(toDate === undefined ? {} : { toDate }),
    page: read(params, "page", pageSchema) ?? 0,
  };
}

/** URL 상태를 쓴다. 거르기를 바꾸면 첫 쪽부터 다시 보도록 쪽 번호는 0일 때 뺀다. */
export function toMyEventSearchParams(filters: MyEventFilters): URLSearchParams {
  const next = toEventSearchParams(new URLSearchParams(), filters.query);
  if (filters.fromDate !== undefined) {
    next.set("from", filters.fromDate);
  }
  if (filters.toDate !== undefined) {
    next.set("to", filters.toDate);
  }
  if (filters.page > 0) {
    next.set("page", String(filters.page));
  }
  return next;
}

/** listMyEvents 쿼리. 종료일은 그날 끝까지 포함하도록 다음 날 서울 자정을 상한(제외)으로 보낸다(계약 to는 제외). */
export function toMyEventQuery(filters: MyEventFilters): MyEventQuery {
  return {
    ...filters.query,
    ...(filters.fromDate === undefined
      ? {}
      : { from: seoulMidnight(filters.fromDate).toISOString() }),
    ...(filters.toDate === undefined
      ? {}
      : { to: new Date(seoulMidnight(filters.toDate).getTime() + DAY_MS).toISOString() }),
  };
}

// ai-gateway가 예산·호출 상한 때문에 판정하지 않은 이유(SPEC-016 R-11, quality-service 열린 목록)
const BUDGET_REASONS = new Set(["budget_exceeded", "call_cap_reached"]);

/** 예산·상한 초과로 판정하지 않은 이벤트 수(SPEC-031 R-23) */
export function countBudgetSkipped(events: readonly EventSummary[]): number {
  return events.filter(
    (event) =>
      event.verificationStatus === "unverified" &&
      event.unverifiedReason !== undefined &&
      BUDGET_REASONS.has(event.unverifiedReason),
  ).length;
}
