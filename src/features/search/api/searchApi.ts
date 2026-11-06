import { apiRequest, apiRequestNoContent } from "../../../shared/api/client";
import {
  answerResultSchema,
  groundingClipSchema,
  momentSearchResultSchema,
  type FeedbackRequest,
} from "../model/schemas";

// 계약 search-service.yaml 공개 API. api-gateway가 접근 토큰을 검증하고 X-User-Id를 붙인다.
const SEARCH = "/api/v1/search";

/** 영상 안에서 문장으로 장면 찾기(operationId searchSourceMoments) */
export function searchSourceMoments(sourceId: string, q: string, precise: boolean) {
  return apiRequest(`${SEARCH}/sources/${sourceId}/moments`, momentSearchResultSchema, {
    query: { q, precise },
  });
}

/** 내 영상 전체에서 장면 찾기(operationId searchAllMoments). 정밀 검색은 없다. */
export function searchAllMoments(q: string) {
  return apiRequest(`${SEARCH}/moments`, momentSearchResultSchema, { query: { q } });
}

/** 이미지로 장면 찾기(operationId searchMomentsByImage). sourceId가 없으면 내 영상 전체다. */
export function searchMomentsByImage(image: File, sourceId?: string) {
  const body = new FormData();
  body.set("image", image, image.name);
  if (sourceId !== undefined) {
    body.set("sourceId", sourceId);
  }
  return apiRequest(`${SEARCH}/moments/by-image`, momentSearchResultSchema, {
    method: "POST",
    body,
  });
}

/** 영상에 질문(operationId answerSourceQuestion). 서버는 15초까지 걸릴 수 있다. */
export function answerSourceQuestion(sourceId: string, q: string) {
  return apiRequest(`${SEARCH}/sources/${sourceId}/answer`, answerResultSchema, { query: { q } });
}

/** 이동·재생 기록과 맞음·틀림(operationId sendMomentFeedback) */
export function sendMomentFeedback(momentId: string, request: FeedbackRequest) {
  return apiRequestNoContent(`${SEARCH}/moments/${momentId}/feedback`, {
    method: "POST",
    body: request,
  });
}

/** bbox 주석 클립(operationId getGroundingClip) */
export function getGroundingClip(groundingId: string) {
  return apiRequest(`${SEARCH}/groundings/${groundingId}`, groundingClipSchema);
}
