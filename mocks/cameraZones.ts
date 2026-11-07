// SPEC-032 R-16 카메라 구역(stream-service getCameraZones·replaceCameraZones) 픽스처와 MSW 핸들러. 생성 타입으로 검사한다.
import { http, HttpResponse } from "msw";
import { z } from "zod";
import type { components } from "../src/api/generated/stream-service";
import { problem } from "./handlers";

type Schemas = components["schemas"];
export type CameraZoneBody = Schemas["Zone"];
export type CameraZoneListBody = Schemas["ZoneList"];

const STREAM_API = "http://localhost:8080/api/v1/stream";
export const ZONE_CAMERA_ID = "0192fb00-0000-7000-8000-000000000020";

/** 계약 getCameraZones 예시 구역 */
export function cameraZoneBody(overrides: Partial<CameraZoneBody> = {}): CameraZoneBody {
  return {
    zoneId: "0192f100-0000-7000-8000-0000000000f1",
    name: "A동 크레인 하부",
    kind: "hazard",
    polygon: [
      [0.1, 0.2],
      [0.6, 0.2],
      [0.6, 0.9],
      [0.1, 0.9],
    ],
    ...overrides,
  };
}

export function cameraZoneListBody(
  zones: CameraZoneBody[] = [cameraZoneBody()],
): CameraZoneListBody {
  return { zones, updatedAt: "2026-11-06T09:30:00Z" };
}

const zoneListSchema = z.object({
  zones: z
    .array(
      z.object({
        zoneId: z.guid(),
        name: z.string().min(1).max(100),
        kind: z.enum(["hazard", "aisle", "storage", "general"]),
        polygon: z
          .array(z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]))
          .min(3)
          .max(64),
      }),
    )
    .max(100),
  updatedAt: z.string().nullable(),
}) satisfies z.ZodType<CameraZoneListBody>;

/** 카메라 하나의 구역 API. 바꾼 구역은 다음 조회에도 보인다. */
export function cameraZoneHandlers(zones: CameraZoneBody[] = [cameraZoneBody()]) {
  let current = cameraZoneListBody(zones);
  return [
    http.get(`${STREAM_API}/cameras/:cameraId/zones`, () => HttpResponse.json(current)),
    http.put(`${STREAM_API}/cameras/:cameraId/zones`, async ({ request }) => {
      const body = zoneListSchema.safeParse(await request.json());
      if (!body.success) {
        return problem(400, "STREAM_INVALID_REQUEST");
      }
      current = { zones: body.data.zones, updatedAt: "2026-11-06T12:00:00Z" };
      return HttpResponse.json(current);
    }),
  ];
}
