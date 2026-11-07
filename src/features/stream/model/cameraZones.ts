import { z } from "zod";
import type { components } from "../../../api/generated/stream-service";

type Schemas = components["schemas"];

/** 카메라 구역 종류(계약 stream Zone.kind). 업로드 영상보다 적치구역(storage)이 더 있다. */
export const CAMERA_ZONE_KINDS = ["hazard", "aisle", "storage", "general"] as const;

/** 계약 stream-service Zone. 꼭짓점은 [x, y] 배열이다. */
export const cameraZoneSchema = z.object({
  zoneId: z.string(),
  name: z.string(),
  kind: z.enum(CAMERA_ZONE_KINDS),
  polygon: z.array(z.tuple([z.number(), z.number()])),
}) satisfies z.ZodType<Schemas["Zone"]>;
export type CameraZone = z.infer<typeof cameraZoneSchema>;

/** 계약 stream-service ZoneList(getCameraZones·replaceCameraZones) */
export const cameraZoneListSchema = z.object({
  zones: z.array(cameraZoneSchema),
  updatedAt: z.string().nullable(),
}) satisfies z.ZodType<Schemas["ZoneList"]>;
export type CameraZoneList = z.infer<typeof cameraZoneListSchema>;
