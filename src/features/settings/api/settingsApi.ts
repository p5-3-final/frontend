import { apiRequest, apiRequestNoContent } from "../../../shared/api/client";
import {
  retainedVideoPageSchema,
  retentionSettingsSchema,
  type RetentionSettings,
} from "../model/schemas";

// 계약 media-service.yaml 학습용 보존 API(SPEC-018).
const SETTINGS = "/api/v1/media/retention-settings";
const RETAINED = "/api/v1/media/retained-videos";

export const RETAINED_PAGE_SIZE = 20;

/** 보존 기본값(operationId getRetentionSettings) */
export function getRetentionSettings() {
  return apiRequest(SETTINGS, retentionSettingsSchema);
}

/** 보존 기본값 바꾸기(operationId updateRetentionSettings). 이미 있는 영상의 동의는 바뀌지 않는다. */
export function updateRetentionSettings(settings: RetentionSettings) {
  return apiRequest(SETTINGS, retentionSettingsSchema, { method: "PUT", body: settings });
}

/** 보존 중인 삭제 영상 한 쪽(operationId listRetainedVideos) */
export function listRetainedVideos(page: number) {
  return apiRequest(RETAINED, retainedVideoPageSchema, {
    query: { page, size: RETAINED_PAGE_SIZE },
  });
}

/** 영상 하나의 보존 철회(operationId revokeRetainedVideo) */
export function revokeRetainedVideo(videoId: string) {
  return apiRequestNoContent(`${RETAINED}/${videoId}`, { method: "DELETE" });
}

/** 보존 중인 영상 모두 철회(operationId revokeAllRetainedVideos) */
export function revokeAllRetainedVideos() {
  return apiRequestNoContent(RETAINED, { method: "DELETE" });
}
