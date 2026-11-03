import type { VideoStatus } from "./schemas";

/** SPEC-005 R-16: 영상 상태 이름 */
export const VIDEO_STATUS_NAMES: Readonly<Record<VideoStatus, string>> = {
  UPLOADING: "업로드 중",
  UPLOADED: "업로드 완료",
  EXPIRED: "만료됨",
  NORMALIZING: "변환 중",
  READY: "분석 준비됨",
  REJECTED: "처리 불가",
};
