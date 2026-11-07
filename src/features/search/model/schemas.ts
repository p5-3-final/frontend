import { z } from "zod";
import type { components } from "../../../api/generated/search-service";

type Schemas = components["schemas"];

// 계약 search-service.yaml 0.1.0(생산자 확인 전 초안). 생성 타입과 맞는지 satisfies로 확인한다.

export const GROUNDING_STATUSES = ["NONE", "REQUESTED", "READY", "FAILED"] as const;
export type GroundingStatus = (typeof GROUNDING_STATUSES)[number];

export const MATCHED_BY = ["visual", "text", "image"] as const;
export type MatchedBy = (typeof MATCHED_BY)[number];

export const DEGRADED_REASONS = [
  "rerank_timeout",
  "circuit_open",
  "precise_quota_exceeded",
  "ai_unavailable",
] as const;
export type DegradedReason = (typeof DEGRADED_REASONS)[number];

export const PARSE_METHODS = [
  "industrial-rule",
  "english-phrase",
  "llm",
  "safe-fallback",
  "image",
] as const;
export type ParseMethod = (typeof PARSE_METHODS)[number];

/** 계약 MomentSearchResult.results 최대 개수 */
export const MAX_RESULTS = 50;

const degradedSchema = z
  .object({ reason: z.enum(DEGRADED_REASONS) })
  .nullable() satisfies z.ZodType<Schemas["Degraded"]>;
export type Degraded = z.infer<typeof degradedSchema>;

/** 계약 MomentResult */
export const momentResultSchema = z.object({
  momentId: z.string(),
  sourceId: z.string(),
  segmentId: z.string().nullable(),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  seekMs: z.number().int().min(0),
  similarity: z.number(),
  matchedBy: z.array(z.enum(MATCHED_BY)),
  rerankScore: z.number().min(0).max(1).nullable(),
  thumbnailUrl: z.string().nullable(),
  relatedEventId: z.string().nullable(),
  grounding: z.object({ groundingId: z.string(), status: z.enum(GROUNDING_STATUSES) }),
}) satisfies z.ZodType<Schemas["MomentResult"]>;
export type MomentResult = z.infer<typeof momentResultSchema>;

/** 계약 MomentSearchResult(문장·이미지 검색 공통) */
export const momentSearchResultSchema = z.object({
  queryId: z.string(),
  query: z.string(),
  canonicalQuery: z.string(),
  parseMethod: z.enum(PARSE_METHODS),
  targets: z.array(z.string()).max(3),
  scope: z.enum(["source", "all"]),
  precise: z.boolean(),
  embeddingModel: z.string(),
  notFound: z.boolean(),
  degraded: degradedSchema,
  reused: z.boolean(),
  results: z.array(momentResultSchema).max(MAX_RESULTS),
}) satisfies z.ZodType<Schemas["MomentSearchResult"]>;
export type MomentSearchResult = z.infer<typeof momentSearchResultSchema>;

/** 계약 AnswerResult(영상 질문) */
export const answerResultSchema = z.object({
  queryId: z.string(),
  question: z.string(),
  answer: z.string().nullable(),
  status: z.enum(["confirmed", "unverified"]),
  evidence: z.array(momentResultSchema).max(10),
  relatedEvents: z
    .array(
      z.object({
        eventId: z.string(),
        eventType: z.string(),
        startMs: z.number().int().min(0),
        seekMs: z.number().int().min(0),
        description: z.string().nullable(),
      }),
    )
    .max(10),
  limitations: z.array(z.string()),
  degraded: degradedSchema,
}) satisfies z.ZodType<Schemas["AnswerResult"]>;
export type AnswerResult = z.infer<typeof answerResultSchema>;
export type RelatedEvent = AnswerResult["relatedEvents"][number];

/** 계약 GroundingClip. `frames[].ptsMs`는 원본 영상 시각이다(계약 예시가 구간 startMs에서 시작). */
export const groundingClipSchema = z.object({
  groundingId: z.string(),
  segmentId: z.string(),
  status: z.enum(["REQUESTED", "READY", "FAILED"]),
  targets: z.array(z.string()),
  clipUrl: z.string().nullable(),
  colors: z.record(z.string(), z.string()),
  frames: z
    .array(
      z.object({ ptsMs: z.number().int().min(0), counts: z.record(z.string(), z.number().int()) }),
    )
    .nullable(),
}) satisfies z.ZodType<Schemas["GroundingClip"]>;
export type GroundingClip = z.infer<typeof groundingClipSchema>;

export type FeedbackKind = Schemas["FeedbackRequest"]["kind"];
export type FeedbackRequest = Schemas["FeedbackRequest"];
