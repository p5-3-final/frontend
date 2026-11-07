import { apiRequest } from "../../../shared/api/client";
import { cameraZoneListSchema, type CameraZoneList } from "../model/cameraZones";

// 계약 stream-service.yaml 카메라 구역(SPEC-036 R-2). 다음 세션 시작부터 적용된다.
const CAMERAS = "/api/v1/stream/cameras";

/** 카메라 구역 목록(operationId getCameraZones) */
export function getCameraZones(cameraId: string) {
  return apiRequest(`${CAMERAS}/${cameraId}/zones`, cameraZoneListSchema);
}

/** 카메라 구역 전체 바꾸기(operationId replaceCameraZones) */
export function putCameraZones(cameraId: string, list: CameraZoneList) {
  return apiRequest(`${CAMERAS}/${cameraId}/zones`, cameraZoneListSchema, {
    method: "PUT",
    body: list,
  });
}
