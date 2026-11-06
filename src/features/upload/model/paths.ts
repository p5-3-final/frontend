import { SEEK_PARAM } from "../../player";

/** 내 영상 목록이 있는 영상 분석 화면 주소 */
export const VIDEO_LIST_PATH = "/analysis";

export interface VideoDetailPathOptions {
  /** 그 이벤트가 열린 상태로 연다(SPEC-031 R-11). 플레이어는 이벤트의 seekMs로 간다. */
  eventId?: string;
  /** 이벤트가 아닌 시각(위험 시작 시각 등)으로 플레이어를 옮겨 연다(SPEC-034 R-4). */
  seekMs?: number;
}

/** 영상 상세 화면 주소(SPEC-006 R-6) */
export function videoDetailPath(videoId: string, options: VideoDetailPathOptions = {}) {
  const path = `${VIDEO_LIST_PATH}/videos/${videoId}`;
  const params = new URLSearchParams();
  if (options.eventId !== undefined) {
    params.set("event", options.eventId);
  }
  if (options.seekMs !== undefined) {
    params.set(SEEK_PARAM, String(Math.max(0, Math.round(options.seekMs))));
  }
  const search = params.toString();
  return search === "" ? path : `${path}?${search}`;
}
