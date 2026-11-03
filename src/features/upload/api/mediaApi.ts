import { apiRequest, apiRequestNoContent } from "../../../shared/api/client";
import {
  createVideoResponseSchema,
  videoPageSchema,
  videoSchema,
  type CompletedPart,
  type CreateVideoRequest,
} from "../model/schemas";

// 계약 media-service.yaml 1.0.1. api-gateway를 거치므로 접근 토큰 만료 시 재발급 후 재시도된다(SPEC-002 R-9).
const VIDEOS = "/api/v1/media/videos";

/** 업로드 자리 발급(operationId createVideo) */
export function createVideo(request: CreateVideoRequest, signal?: AbortSignal) {
  return apiRequest(VIDEOS, createVideoResponseSchema, { method: "POST", body: request, signal });
}

/** 업로드 완료(operationId completeVideoUpload). 단일 업로드는 본문 없이 보낸다. */
export function completeVideoUpload(
  videoId: string,
  parts?: CompletedPart[],
  signal?: AbortSignal,
) {
  return apiRequest(`${VIDEOS}/${videoId}/complete`, videoSchema, {
    method: "POST",
    body: parts === undefined ? undefined : { parts },
    signal,
  });
}

/** 내 영상 목록(operationId listVideos). `page`는 0부터 센다. */
export function listVideos(page: number) {
  return apiRequest(`${VIDEOS}?page=${String(page)}&size=20`, videoPageSchema);
}

/** 영상 삭제(operationId deleteVideo) */
export function deleteVideo(videoId: string) {
  return apiRequestNoContent(`${VIDEOS}/${videoId}`, { method: "DELETE" });
}
