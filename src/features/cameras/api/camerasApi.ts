import { apiRequest } from "../../../shared/api/client";
import { sessionSchema } from "../../stream";
import {
  cameraPageSchema,
  cameraSchema,
  cameraSessionPageSchema,
  type CameraCreateRequest,
} from "../model/schemas";

// 계약 stream-service.yaml 카메라·세션 관리 API(SPEC-036).
const STREAM = "/api/v1/stream";
export const CAMERA_PAGE_SIZE = 20;
// 회전 세션을 이어 보이려면 앞 세션도 같은 쪽에 있어야 해서 최대값(100)으로 받는다(R-14).
export const CAMERA_SESSION_PAGE_SIZE = 100;

/** 카메라 목록(operationId listCameras) */
export function listCameras(page: number) {
  return apiRequest(`${STREAM}/cameras`, cameraPageSchema, {
    query: { page, size: CAMERA_PAGE_SIZE },
  });
}

/** 카메라 등록(operationId createCamera). RTSP 주소 대신 비밀값 참조 이름을 보낸다. */
export function createCamera(request: CameraCreateRequest) {
  return apiRequest(`${STREAM}/cameras`, cameraSchema, { method: "POST", body: request });
}

/** 카메라 상세(operationId getCamera) */
export function getCamera(cameraId: string) {
  return apiRequest(`${STREAM}/cameras/${cameraId}`, cameraSchema);
}

/** 카메라 세션 이력(operationId listCameraSessions). 최근 세션부터다. */
export function listCameraSessions(cameraId: string) {
  return apiRequest(`${STREAM}/cameras/${cameraId}/sessions`, cameraSessionPageSchema, {
    query: { page: 0, size: CAMERA_SESSION_PAGE_SIZE },
  });
}

/** 수집 세션 시작(operationId startSession). 활성 세션이 있으면 409다. */
export function startSession(cameraId: string) {
  return apiRequest(`${STREAM}/cameras/${cameraId}/sessions`, sessionSchema, { method: "POST" });
}

/** 수집 세션 중지(operationId stopSession). 마지막 창까지 처리되면 CLOSED가 된다. */
export function stopSession(sessionId: string) {
  return apiRequest(`${STREAM}/sessions/${sessionId}`, sessionSchema, { method: "DELETE" });
}
