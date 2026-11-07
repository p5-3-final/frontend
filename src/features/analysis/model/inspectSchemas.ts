import { z } from "zod";
import type { components } from "../../../api/generated/analysis-service";
import { verificationStatusSchema } from "./schemas";

type Schemas = components["schemas"];

// SPEC-032 공개 API(오버레이·클릭 조회·트랙·질문·구역) 응답 스키마. 계약 analysis-service.yaml 0.4.0.

/** 계약 NormBox. 프레임 크기로 나눈 0~1 좌표, 왼쪽 위 기준이다. */
export const normBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
}) satisfies z.ZodType<Schemas["NormBox"]>;
export type NormBox = z.infer<typeof normBoxSchema>;

export const overlayTrackSchema = z.object({
  trackId: z.string(),
  className: z.string(),
  hasEvent: z.boolean(),
  boxes: z.array(z.object({ ptsMs: z.number(), box: normBoxSchema })),
}) satisfies z.ZodType<Schemas["OverlayTrack"]>;
export type OverlayTrack = z.infer<typeof overlayTrackSchema>;

/** 계약 Overlay(getSourceOverlay) */
export const overlaySchema = z.object({
  sourceId: z.string(),
  fromMs: z.number(),
  toMs: z.number(),
  tracks: z.array(overlayTrackSchema),
}) satisfies z.ZodType<Schemas["Overlay"]>;
export type Overlay = z.infer<typeof overlaySchema>;

// taxonomy/v2 ppeState·workerRole. 역할은 AI 담당자가 값을 더할 수 있어(추가는 minor) 모르는 값도 받는다.
export const PPE_STATES = ["worn", "not_worn", "unknown"] as const;
export const ppeStateSchema = z.enum(PPE_STATES);
export type PpeState = z.infer<typeof ppeStateSchema>;

/** 계약 events/_track-attribute.schema.json을 옮긴 2차 스키마 */
export const trackAttributeSchema = z.object({
  verificationStatus: verificationStatusSchema,
  helmet: ppeStateSchema.nullable(),
  vest: ppeStateSchema.nullable(),
  role: z.string().nullable(),
  equipment: z.array(z.string()).max(10),
  description: z.string().max(300).nullable(),
});
export type TrackAttribute = z.infer<typeof trackAttributeSchema>;

/** 계약 events/_object-answer.schema.json을 옮긴 2차 스키마 */
export const objectAnswerSchema = z.object({
  verificationStatus: verificationStatusSchema,
  answerable: z.boolean().nullable(),
  answer: z.string().max(1000).nullable(),
});
export type ObjectAnswer = z.infer<typeof objectAnswerSchema>;

export const ATTRIBUTE_STATUSES = ["NONE", "REQUESTED", "READY", "FAILED"] as const;

/**
 * 계약 TrackAttributes(getTrack). `attributes`는 계약이 `type: object`로만 둬 생성 타입이 비어 있으므로
 * 여기서 {@link trackAttributeSchema}로 바로 해석한다. READY가 아니면 null이다.
 */
export const trackSchema = z.object({
  trackId: z.string(),
  className: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  attributeStatus: z.enum(ATTRIBUTE_STATUSES),
  attributes: trackAttributeSchema.nullable(),
  requestId: z.string().nullable(),
});
export type Track = z.infer<typeof trackSchema>;

/** 계약 InspectResult(inspectPoint) */
export const inspectResultSchema = z.object({
  tMs: z.number(),
  x: z.number(),
  y: z.number(),
  hit: z.boolean(),
  box: normBoxSchema.nullable(),
  track: trackSchema.nullable(),
});
export type InspectResult = z.infer<typeof inspectResultSchema>;

/** 계약 AskAccepted(askTrack 202) */
export const askAcceptedSchema = z.object({
  requestId: z.string(),
  status: z.literal("REQUESTED"),
}) satisfies z.ZodType<Schemas["AskAccepted"]>;

/** 계약 QuestionResult(getTrackQuestion). `answer`는 `attributes`와 같은 이유로 여기서 해석한다. */
export const questionResultSchema = z.object({
  requestId: z.string(),
  trackId: z.string(),
  question: z.string(),
  status: z.enum(["REQUESTED", "READY", "FAILED"]),
  answer: objectAnswerSchema.nullable(),
  askedAt: z.string(),
});
export type QuestionResult = z.infer<typeof questionResultSchema>;

/** 질문 입력(R-7). 계약 AskRequest의 1~200자 */
export const QUESTION_MAX_LENGTH = 200;
export const questionFormSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "질문을 입력해 주세요.")
    .max(QUESTION_MAX_LENGTH, `질문은 ${String(QUESTION_MAX_LENGTH)}자 이하로 입력해 주세요.`),
});
export type QuestionForm = z.infer<typeof questionFormSchema>;

export const SOURCE_ZONE_KINDS = ["hazard", "aisle", "general"] as const;

const zonePointSchema = z.object({ x: z.number(), y: z.number() });

/** 계약 ZoneDefinition */
export const zoneDefinitionSchema = z.object({
  zoneId: z.string().nullable(),
  name: z.string(),
  kind: z.enum(SOURCE_ZONE_KINDS),
  polygon: z.array(zonePointSchema),
}) satisfies z.ZodType<Schemas["ZoneDefinition"]>;
export type ZoneDefinition = z.infer<typeof zoneDefinitionSchema>;

/** 계약 ZoneList(getSourceZones·putSourceZones) */
export const zoneListSchema = z.object({
  sourceId: z.string(),
  items: z.array(zoneDefinitionSchema),
  updatedAt: z.string().nullable(),
  reanalysisNeeded: z.boolean(),
}) satisfies z.ZodType<Schemas["ZoneList"]>;
export type ZoneList = z.infer<typeof zoneListSchema>;
