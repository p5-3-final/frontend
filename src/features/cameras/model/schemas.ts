import { z } from "zod";
import type { components, operations } from "../../../api/generated/stream-service";
import { sessionSchema } from "../../stream";

type Schemas = components["schemas"];
type CameraPage = operations["listCameras"]["responses"]["200"]["content"]["application/json"];
type CameraSessionPage =
  operations["listCameraSessions"]["responses"]["200"]["content"]["application/json"];

const pageMetaSchema = z.object({
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export const CAMERA_STATUSES = ["IDLE", "STARTING", "LIVE", "STOPPING", "FAILED"] as const;

/** 계약 Camera. `status`는 활성 세션의 상태이고 없으면 IDLE이다. */
export const cameraSchema = z.object({
  cameraId: z.string(),
  ownerId: z.string(),
  name: z.string(),
  rtspSecretRef: z.string(),
  profileVersion: z.string(),
  status: z.enum(CAMERA_STATUSES),
  activeSessionId: z.string().nullable(),
  createdAt: z.string(),
}) satisfies z.ZodType<Schemas["Camera"]>;
export type Camera = z.infer<typeof cameraSchema>;
export type CameraStatus = Camera["status"];

export const cameraPageSchema = z.object({
  items: z.array(cameraSchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<CameraPage>;

export const cameraSessionPageSchema = z.object({
  items: z.array(sessionSchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<CameraSessionPage>;
export type CameraSession = z.infer<typeof sessionSchema>;

export type CameraCreateRequest = Schemas["CameraCreate"];

/** 기본 수집 프로필(계약 예시 값) */
export const DEFAULT_PROFILE_VERSION = "ingest-default@1";

// 화면은 RTSP 주소·자격 증명을 받지 않는다(계약 CameraCreate.rtspSecretRef 설명). 주소처럼 보이는 값은 막는다.
const URL_LIKE = /^[a-z][a-z0-9+.-]*:\/\//i;

/** 카메라 등록 폼(SPEC-034 R-13). 계약 CameraCreate를 옮긴 것이다. */
export const cameraFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "카메라 이름을 입력해 주세요.")
    .max(100, "카메라 이름은 100자 이하로 입력해 주세요."),
  rtspSecretRef: z
    .string()
    .trim()
    .min(1, "RTSP 비밀값 참조 이름을 입력해 주세요.")
    .refine((value) => !URL_LIKE.test(value), {
      message: "주소가 아니라 Secrets Manager 키 이름을 입력해 주세요.",
    }),
  profileVersion: z.string().trim().min(1, "수집 프로필을 입력해 주세요."),
}) satisfies z.ZodType<CameraCreateRequest>;
export type CameraForm = z.infer<typeof cameraFormSchema>;
