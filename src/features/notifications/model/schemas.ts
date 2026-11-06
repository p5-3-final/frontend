import { z } from "zod";

// 계약 notifications/v1/notification-message.schema.json을 옮긴 스키마. OpenAPI가 참조하지 않아 생성 타입이 없다.
// 계약 예시를 읽는 테스트(schemas.test.ts)로 어긋남을 잡는다. type마다 data 형식이 달라 type으로 나눈다.

const envelope = {
  sourceId: z.string().nullable(),
  occurredAt: z.string(),
};

const jobStatusData = z.strictObject({
  jobId: z.string(),
  status: z.string(),
  progressPercent: z.number().int().min(0).max(100),
  successPercent: z.number().int().min(0).max(100),
  terminal: z.boolean(),
});

const sourceCompletedData = z.strictObject({
  jobId: z.string(),
  summaryStatus: z.string(),
  confirmedEvents: z.number().int().min(0),
  activeRisksAtEnd: z.number().int().min(0),
});

const outcome = z.enum(["READY", "FAILED"]);

const trackAnalyzedData = z.strictObject({
  requestId: z.string(),
  trackId: z.string(),
  reason: z.enum(["event", "click", "question"]),
  outcome,
});

const groundingCompletedData = z.strictObject({
  requestId: z.string(),
  groundingId: z.string(),
  segmentId: z.string(),
  outcome,
});

// taxonomy/v2 detectableEventType: eventType에서 other를 뺀 값
const detectableEventType = z.enum([
  "fall",
  "fire_or_smoke",
  "ppe_missing",
  "object_removed",
  "barrier_not_restored",
  "hazard_zone_access",
  "equipment_abandoned",
  "object_moved",
]);

// v5.1: 긴급 알림. 같은 candidateId가 pending → confirmed·dismissed 순으로 두 번 온다(SPEC-031 R-20).
const alertRaisedData = z.strictObject({
  candidateId: z.string(),
  status: z.enum(["pending", "confirmed", "dismissed"]),
  eventType: detectableEventType,
  severity: z.enum(["low", "medium", "high"]),
  cameraId: z.string(),
  description: z.string().max(500).nullable().optional(),
});

// v5.1: 실시간 창 상태 갱신 요약. 화면은 sequence가 큰 것만 적용한다(SPEC-031 R-21).
const stateUpdatedData = z.strictObject({
  sequence: z.number().int().min(1),
  chunkId: z.string(),
  activeRisks: z.number().int().min(0),
  newRisks: z.number().int().min(0),
  resolvedRisks: z.number().int().min(0),
});

export const notificationMessageSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("alert.raised"), ...envelope, data: alertRaisedData }),
  z.strictObject({ type: z.literal("state.updated"), ...envelope, data: stateUpdatedData }),
  z.strictObject({ type: z.literal("job.status"), ...envelope, data: jobStatusData }),
  z.strictObject({ type: z.literal("source.completed"), ...envelope, data: sourceCompletedData }),
  z.strictObject({ type: z.literal("track.analyzed"), ...envelope, data: trackAnalyzedData }),
  z.strictObject({
    type: z.literal("grounding.completed"),
    ...envelope,
    data: groundingCompletedData,
  }),
  z.strictObject({ type: z.literal("ping"), ...envelope, data: z.strictObject({}) }),
]);

/** 알림 메시지 한 건(SSE data). */
export type NotificationMessage = z.infer<typeof notificationMessageSchema>;
export type NotificationType = NotificationMessage["type"];
/** type으로 좁힌 메시지. 예: `NotificationOf<"job.status">` */
export type NotificationOf<T extends NotificationType> = Extract<NotificationMessage, { type: T }>;
