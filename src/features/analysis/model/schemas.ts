import { z } from "zod";
import type { components, operations } from "../../../api/generated/analysis-service";

type Schemas = components["schemas"];
type EventPageResponse =
  operations["listSourceEvents"]["responses"]["200"]["content"]["application/json"];

// 계약 taxonomy/v2 eventType
export const EVENT_TYPES = [
  "fall",
  "fire_or_smoke",
  "ppe_missing",
  "object_removed",
  "barrier_not_restored",
  "hazard_zone_access",
  "equipment_abandoned",
  "object_moved",
  "other",
] as const;
export const eventTypeSchema = z.enum(EVENT_TYPES) satisfies z.ZodType<Schemas["eventType"]>;
export type EventType = z.infer<typeof eventTypeSchema>;

export const SEVERITIES = ["low", "medium", "high"] as const;
export const severitySchema = z.enum(SEVERITIES);
export type Severity = z.infer<typeof severitySchema>;

export const VERIFICATION_STATUSES = ["confirmed", "rejected", "unverified", "unknown"] as const;
export const verificationStatusSchema = z.enum(VERIFICATION_STATUSES);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const REVIEW_STATES = ["UNREVIEWED", "CONFIRMED", "DISMISSED"] as const;
export const reviewStateSchema = z.enum(REVIEW_STATES);
export type ReviewState = z.infer<typeof reviewStateSchema>;

/** `unverified`인 이유. analysis 계약에는 아직 없는 v5.1 필드라 선택 필드로 받는다(SPEC-031 R-23, 생산자 확인 필요). */
export const unverifiedReasonSchema = z.string();

const pageMetaSchema = z.object({
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

/** 계약 EventSummary */
export const eventSummarySchema = z.object({
  eventId: z.string(),
  sourceId: z.string(),
  eventType: eventTypeSchema,
  startMs: z.number(),
  endMs: z.number(),
  seekMs: z.number(),
  severity: severitySchema.nullable(),
  verificationStatus: verificationStatusSchema,
  judgmentMethod: z.string(),
  description: z.string().nullable(),
  zoneId: z.string().nullable(),
  zoneName: z.string().nullable(),
  trackId: z.string().nullable(),
  reviewRequired: z.boolean(),
  reviewState: reviewStateSchema,
  thumbnailUrl: z.string().nullable(),
  mergedInto: z.string().nullable(),
  origin: z.enum(["candidate", "rule", "inventory"]),
  unverifiedReason: unverifiedReasonSchema.nullable().optional(),
}) satisfies z.ZodType<Schemas["EventSummary"]>;
export type EventSummary = z.infer<typeof eventSummarySchema>;

/** listSourceEvents·listMyEvents 응답 */
export const eventPageSchema = z.object({
  items: z.array(eventSummarySchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<EventPageResponse>;
export type EventPage = z.infer<typeof eventPageSchema>;

/**
 * 계약 EventDetail. `analysis`는 계약이 `type: object`로만 둬 생성 타입이 `Record<string, never>`이므로
 * 여기서는 열린 객체로 받고, 화면에 쓰기 전에 {@link vlmAnalysisSchema}로 한 번 더 해석한다.
 */
export const eventDetailSchema = z.object({
  event: eventSummarySchema,
  analysis: z.record(z.string(), z.unknown()),
  evidenceFrames: z.array(z.object({ ptsMs: z.number().nullable(), url: z.string() })),
  judgments: z.array(
    z.object({
      taskType: z.string(),
      modelId: z.string().nullable(),
      verificationStatus: z.string(),
      eventDetected: z.boolean().nullable(),
    }),
  ),
  reviewReasons: z.array(z.string()),
  detectorProfile: z.string().nullable(),
  versions: z.record(z.string(), z.string()),
  reviewNote: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
});
export type EventDetail = z.infer<typeof eventDetailSchema>;

/** 계약 events/_vlm-analysis.schema.json을 옮긴 2차 스키마. 화면에 필요한 필드만 검증한다. */
export const vlmAnalysisSchema = z.object({
  eventType: eventTypeSchema,
  eventDetected: z.boolean().nullable(),
  verificationStatus: verificationStatusSchema,
  description: z.string().nullable(),
  beforeState: z.string().nullable(),
  afterState: z.string().nullable(),
  riskDetected: z.boolean().nullable(),
  riskType: z.string().nullable(),
  riskReason: z.string().nullable(),
  solution: z.string().nullable(),
  severity: severitySchema.nullable(),
  evidenceStart: z.number().min(0).nullable(),
  evidenceEnd: z.number().min(0).nullable(),
});
export type VlmAnalysis = z.infer<typeof vlmAnalysisSchema>;

/** 계약 events/_risk-forecast.schema.json을 옮긴 2차 스키마 */
export const riskForecastSchema = z.object({
  method: z.enum(["rule", "model"]),
  horizons: z
    .array(
      z.object({
        horizonSec: z.number().int().min(60).max(86400),
        exposureProbability: z.number().min(0).max(1),
      }),
    )
    .max(6),
  features: z.record(z.string(), z.number()),
});
export type RiskForecast = z.infer<typeof riskForecastSchema>;

/** 계약 Risk. `forecast`는 `analysis`와 같은 이유로 열린 객체로 받는다. */
export const riskSchema = z.object({
  riskId: z.string(),
  zoneId: z.string(),
  zoneName: z.string().nullable(),
  riskType: z.string(),
  status: z.enum(["active", "resolved"]),
  reason: z.string(),
  firstSeenMs: z.number(),
  lastSeenMs: z.number(),
  resolvedAtMs: z.number().nullable(),
  relatedEventIds: z.array(z.string()),
  carriedOver: z.boolean(),
  exposure: z.object({
    activeSeconds: z.number(),
    exposureCount: z.number(),
    exposureSeconds: z.number(),
  }),
  forecast: z.record(z.string(), z.unknown()).nullable(),
});
export type Risk = z.infer<typeof riskSchema>;

export const riskListSchema = z.object({
  jobId: z.string().nullable(),
  items: z.array(riskSchema),
});

/** 계약 Snapshot */
export const snapshotSchema = z.object({
  snapshotId: z.string(),
  zoneId: z.string(),
  zoneName: z.string().nullable(),
  timestampMs: z.number(),
  previousState: z.string().nullable(),
  currentState: z.string().nullable(),
  relatedEventId: z.string(),
}) satisfies z.ZodType<Schemas["Snapshot"]>;
export type Snapshot = z.infer<typeof snapshotSchema>;

export const snapshotListSchema = z.object({
  jobId: z.string().nullable(),
  items: z.array(snapshotSchema),
}) satisfies z.ZodType<Schemas["SnapshotList"]>;

export const TIMELINE_KINDS = [
  "event",
  "rule_event",
  "risk_activated",
  "risk_resolved",
  "inventory_event",
] as const;

/**
 * 계약 SourceSummary. `partial`·`missingCounts`는 analysis 계약에 아직 없는 v5.1 필드라 선택 필드로 받는다
 * (SPEC-031 R-22, source.completed의 같은 이름 필드, 생산자 확인 필요).
 */
export const sourceSummarySchema = z.object({
  sourceId: z.string(),
  status: z.enum(["NOT_ANALYZED", "READY"]),
  jobId: z.string().nullable(),
  summary: z
    .object({
      status: z.enum(["generated", "not_configured", "failed", "empty"]),
      text: z.string().nullable(),
      highlights: z.array(z.object({ atMs: z.number(), text: z.string() })),
    })
    .nullable(),
  counts: z.record(z.string(), z.number()),
  unsupportedEvents: z.record(z.string(), z.string()),
  session: z
    .object({
      sessionId: z.string(),
      role: z.enum(["BEFORE", "DURING", "AFTER"]),
      previousSourceId: z.string().nullable(),
      initialStateUsed: z.boolean(),
    })
    .nullable(),
  timeline: z.array(
    z.object({
      atMs: z.number(),
      kind: z.enum(TIMELINE_KINDS),
      refId: z.string(),
      eventType: z.string().nullable(),
      zoneId: z.string().nullable(),
      severity: z.string().nullable(),
    }),
  ),
  analyzedAt: z.string().nullable(),
  partial: z.boolean().optional(),
  missingCounts: z.record(z.string(), z.number()).optional(),
}) satisfies z.ZodType<Schemas["SourceSummary"]>;
export type SourceSummary = z.infer<typeof sourceSummarySchema>;

export type ReviewEventRequest = Schemas["ReviewEventRequest"];
