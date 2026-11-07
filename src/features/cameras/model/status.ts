import type { SessionStatus } from "../../stream";
import type { CameraStatus } from "./schemas";

/** 카메라·세션 상태 이름(SPEC-034 R-13) */
export const CAMERA_STATUS_NAMES: Readonly<Record<CameraStatus | SessionStatus, string>> = {
  IDLE: "대기",
  STARTING: "시작 중",
  LIVE: "수집 중",
  STOPPING: "중지 중",
  CLOSED: "끝남",
  FAILED: "실패",
};

/**
 * 상태가 곧 바뀌는 동안 다시 읽는 간격(plan 9절). 실시간 세션 화면(10초)보다 길게 둔다.
 * 카메라 화면은 상태만 보이고 위험·알림은 세션 화면이 보인다.
 */
export const CAMERA_POLL_MS = 15_000;
