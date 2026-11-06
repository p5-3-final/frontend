import { z } from "zod";
import type { components } from "../../../api/generated/media-service";

type Schemas = components["schemas"];

const contentTypeSchema = z.enum([
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
]) satisfies z.ZodType<Schemas["VideoContentType"]>;

export type VideoContentType = z.infer<typeof contentTypeSchema>;

const statusSchema = z.enum([
  "UPLOADING",
  "UPLOADED",
  "NORMALIZING",
  "READY",
  "REJECTED",
  "EXPIRED",
]) satisfies z.ZodType<Schemas["VideoStatus"]>;

export type VideoStatus = z.infer<typeof statusSchema>;

const sessionRoleSchema = z.enum(["BEFORE", "DURING", "AFTER"]) satisfies z.ZodType<
  Schemas["SessionRole"]
>;

const rejectReasonSchema = z.enum([
  "UNREADABLE",
  "NO_VIDEO_STREAM",
  "MISSING_METADATA",
  "TOO_SHORT",
  "TOO_LONG",
  "DECODE_FAILED",
]);

/** 계약 VideoResponse */
export const videoSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  fileName: z.string(),
  sizeBytes: z.number(),
  contentType: contentTypeSchema,
  status: statusSchema,
  createdAt: z.string(),
  uploadedAt: z.string().nullable(),
  durationSec: z.number().nullable().optional(),
  estimatedProcessingSec: z.number().nullable().optional(),
  session: z.object({ sessionId: z.string(), role: sessionRoleSchema }).nullable(),
  retentionConsent: z.boolean(),
  rejectReason: rejectReasonSchema.nullable().optional(),
}) satisfies z.ZodType<Schemas["VideoResponse"]>;

export type Video = z.infer<typeof videoSchema>;

/** 계약 VideoPlayback. 서명 주소라 메모리에만 두고 로그·브라우저 저장소에 남기지 않는다(SPEC-006 NFR-3). */
export const videoPlaybackSchema = z.object({
  url: z.string(),
  downloadUrl: z.string(),
  expiresAt: z.string(),
}) satisfies z.ZodType<Schemas["VideoPlayback"]>;

export type VideoPlayback = z.infer<typeof videoPlaybackSchema>;

/** 계약 VideoPage */
export const videoPageSchema = z.object({
  items: z.array(videoSchema),
  page: z.object({
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
  }),
}) satisfies z.ZodType<Schemas["VideoPage"]>;

export type VideoPage = z.infer<typeof videoPageSchema>;

const singleUploadSchema = z.object({
  method: z.literal("SINGLE"),
  url: z.string(),
  fields: z.record(z.string(), z.string()),
  expiresAt: z.string(),
}) satisfies z.ZodType<Schemas["SingleUpload"]>;

const multipartUploadSchema = z.object({
  method: z.literal("MULTIPART"),
  partSizeBytes: z.number(),
  parts: z.array(z.object({ partNumber: z.number(), url: z.string() })),
  expiresAt: z.string(),
}) satisfies z.ZodType<Schemas["MultipartUpload"]>;

/** 계약 CreateVideoResponse. 업로드 방법은 `method`로 나눈다. */
export const createVideoResponseSchema = z.object({
  video: videoSchema,
  upload: z.discriminatedUnion("method", [singleUploadSchema, multipartUploadSchema]),
}) satisfies z.ZodType<Schemas["CreateVideoResponse"]>;

export type UploadInstruction = z.infer<typeof createVideoResponseSchema>["upload"];

export type CreateVideoRequest = Schemas["CreateVideoRequest"];
export type CompletedPart = NonNullable<Schemas["CompleteUploadRequest"]["parts"]>[number];
