import { z } from "zod";
import type { components } from "../../../api/generated/media-service";
import { videoSchema } from "../../upload";
import { SESSION_ROLES } from "./roles";

type Schemas = components["schemas"];

export const sessionRoleSchema = z.enum(SESSION_ROLES) satisfies z.ZodType<Schemas["SessionRole"]>;

const pageMetaSchema = z.object({
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

/** 계약 WorkSession */
export const workSessionSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  site: z.string().nullable(),
  area: z.string().nullable(),
  createdAt: z.string(),
}) satisfies z.ZodType<Schemas["WorkSession"]>;
export type WorkSession = z.infer<typeof workSessionSchema>;

/** 계약 WorkSessionDetail. `videos`는 서버가 역할 순·업로드 완료 순으로 준다. */
export const workSessionDetailSchema = workSessionSchema.extend({
  videos: z.array(videoSchema),
}) satisfies z.ZodType<Schemas["WorkSessionDetail"]>;
export type WorkSessionDetail = z.infer<typeof workSessionDetailSchema>;

/** 계약 WorkSessionPage */
export const workSessionPageSchema = z.object({
  items: z.array(workSessionSchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<Schemas["WorkSessionPage"]>;
export type WorkSessionPage = z.infer<typeof workSessionPageSchema>;

export type CreateWorkSessionRequest = Schemas["CreateWorkSessionRequest"];

// SPEC-034 R-2: 계약 CreateWorkSessionRequest와 같은 길이 제한(이름 1~100자, 현장·구역 100자 이하).
const NAME_MAX = 100;

/** 세션 만들기 폼. 빈 현장·구역은 보내지 않는다({@link toCreateRequest}). */
export const createSessionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "세션 이름을 입력해 주세요.")
    .max(NAME_MAX, "세션 이름은 100자 이하로 입력해 주세요."),
  site: z.string().trim().max(NAME_MAX, "현장 이름은 100자 이하로 입력해 주세요."),
  area: z.string().trim().max(NAME_MAX, "구역 이름은 100자 이하로 입력해 주세요."),
});
export type CreateSessionForm = z.infer<typeof createSessionFormSchema>;

export function toCreateRequest(form: CreateSessionForm): CreateWorkSessionRequest {
  return {
    name: form.name,
    site: form.site === "" ? null : form.site,
    area: form.area === "" ? null : form.area,
  };
}
