import { z } from "zod";
import type { components } from "../../../api/generated/media-service";

type Schemas = components["schemas"];

/** 계약 RetentionSettings */
export const retentionSettingsSchema = z.object({
  defaultConsent: z.boolean(),
}) satisfies z.ZodType<Schemas["RetentionSettings"]>;
export type RetentionSettings = z.infer<typeof retentionSettingsSchema>;

/** 계약 RetainedVideo */
export const retainedVideoSchema = z.object({
  videoId: z.string(),
  deletedAt: z.string(),
  retainUntil: z.string(),
}) satisfies z.ZodType<Schemas["RetainedVideo"]>;
export type RetainedVideo = z.infer<typeof retainedVideoSchema>;

/** 계약 RetainedVideoPage */
export const retainedVideoPageSchema = z.object({
  items: z.array(retainedVideoSchema),
  page: z.object({
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
  }),
}) satisfies z.ZodType<Schemas["RetainedVideoPage"]>;
export type RetainedVideoPage = z.infer<typeof retainedVideoPageSchema>;
