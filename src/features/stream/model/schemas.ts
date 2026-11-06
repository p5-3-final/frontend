import { z } from "zod";
import type { components, operations } from "../../../api/generated/stream-service";

type Schemas = components["schemas"];
type LiveEventPage =
  operations["listSessionEvents"]["responses"]["200"]["content"]["application/json"];
type AlertPage = operations["listSessionAlerts"]["responses"]["200"]["content"]["application/json"];

const EVENT_TYPES = [
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
const eventTypeSchema = z.enum(EVENT_TYPES);
const severitySchema = z.enum(["low", "medium", "high"]);

const pageMetaSchema = z.object({
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export const SESSION_STATUSES = ["STARTING", "LIVE", "STOPPING", "CLOSED", "FAILED"] as const;

/** 계약 Session */
export const sessionSchema = z.object({
  sessionId: z.string(),
  sourceId: z.string(),
  jobId: z.string(),
  cameraId: z.string(),
  status: z.enum(SESSION_STATUSES),
  previousSourceId: z.string().nullable(),
  startedAt: z.string(),
  closedAt: z.string().nullable(),
  lastWindowSequence: z.number(),
  partialWindows: z.number(),
}) satisfies z.ZodType<Schemas["Session"]>;
export type Session = z.infer<typeof sessionSchema>;
export type SessionStatus = Session["status"];

/** 계약 Playback. 서명 주소라 메모리에만 둔다. */
export const playbackSchema = z.object({
  mode: z.enum(["live", "archive"]),
  hlsUrl: z.string().nullable(),
  expiresAt: z.string(),
  windows: z.array(
    z.object({ chunkId: z.string(), startMs: z.number(), endMs: z.number(), url: z.string() }),
  ),
}) satisfies z.ZodType<Schemas["Playback"]>;
export type Playback = z.infer<typeof playbackSchema>;

/** 계약 SessionState. `sequence`는 반영한 마지막 state.updated다(R-21). */
export const sessionStateSchema = z.object({
  sequence: z.number(),
  asOfMs: z.number(),
  zones: z.array(
    z.object({
      zoneId: z.string(),
      zoneName: z.string().nullable(),
      currentState: z.string().nullable(),
      updatedAtMs: z.number(),
    }),
  ),
  activeRisks: z.array(
    z.object({
      riskId: z.string(),
      zoneId: z.string(),
      riskType: z.string(),
      reason: z.string().nullable(),
      firstSeenMs: z.number(),
      lastSeenMs: z.number(),
      activeSeconds: z.number(),
      exposureCount: z.number(),
      exposureSeconds: z.number(),
    }),
  ),
  partialWindows: z.number(),
  gapMsTotal: z.number(),
}) satisfies z.ZodType<Schemas["SessionState"]>;
export type SessionState = z.infer<typeof sessionStateSchema>;

/** 계약 LiveEvent */
export const liveEventSchema = z.object({
  eventId: z.string(),
  chunkId: z.string(),
  eventType: eventTypeSchema,
  startMs: z.number(),
  endMs: z.number(),
  severity: severitySchema.nullable(),
  verificationStatus: z.enum(["confirmed", "rejected", "unverified", "unknown"]),
  judgmentMethod: z.string(),
  unverifiedReason: z.enum(["budget_exceeded", "model_unavailable", "call_cap_reached"]).nullable(),
  trackId: z.string().nullable(),
  zoneId: z.string().nullable(),
  description: z.string().nullable(),
  evidenceFrameUrls: z.array(z.string()),
}) satisfies z.ZodType<Schemas["LiveEvent"]>;
export type LiveEvent = z.infer<typeof liveEventSchema>;

export const liveEventPageSchema = z.object({
  items: z.array(liveEventSchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<LiveEventPage>;

/** 계약 Alert */
export const alertSchema = z.object({
  candidateId: z.string(),
  status: z.enum(["pending", "confirmed", "dismissed"]),
  eventType: eventTypeSchema,
  reason: z.enum(["severity_high", "active_risk_zone"]),
  severity: severitySchema,
  observedMs: z.number(),
  pendingAt: z.string(),
  decidedAt: z.string().nullable(),
  dismissReason: z.enum(["rejected", "unverified", "unknown"]).nullable(),
  description: z.string().nullable(),
  evidenceFrameUrls: z.array(z.string()),
}) satisfies z.ZodType<Schemas["Alert"]>;
export type SessionAlert = z.infer<typeof alertSchema>;

export const alertPageSchema = z.object({
  items: z.array(alertSchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<AlertPage>;
