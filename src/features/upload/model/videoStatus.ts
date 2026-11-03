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

// SPEC-006 R-8: 업로드가 끝난 뒤의 상태는 원본이 저장소에 있어 재생할 수 있다.
const PLAYABLE_STATUSES: ReadonlySet<VideoStatus> = new Set([
  "UPLOADED",
  "NORMALIZING",
  "READY",
  "REJECTED",
]);

/** 원본을 재생할 수 있는 상태인지(SPEC-006 R-8, R-9) */
export function isPlayable(status: VideoStatus): boolean {
  return PLAYABLE_STATUSES.has(status);
}

/** SPEC-006 R-9: 재생할 수 없는 상태의 이유 */
export const NOT_PLAYABLE_REASONS: Readonly<Partial<Record<VideoStatus, string>>> = {
  UPLOADING: "업로드가 끝나지 않아 재생할 수 없습니다.",
  EXPIRED: "24시간 안에 업로드를 마치지 않아 만료된 영상입니다.",
};
