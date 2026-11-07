/** 내 영상 목록이 있는 영상 분석 화면 주소 */
export const VIDEO_LIST_PATH = "/analysis";

/**
 * 영상 상세 화면 주소(SPEC-006 R-6). `eventId`를 주면 그 이벤트가 열린 상태로 연다(SPEC-031 R-11).
 * `seekMs`를 주면 플레이어가 그 시각에서 시작한다(`?t=`, SPEC-033 R-12).
 */
export function videoDetailPath(
  videoId: string,
  options: { eventId?: string; seekMs?: number } = {},
) {
  const path = `${VIDEO_LIST_PATH}/videos/${videoId}`;
  const params = new URLSearchParams();
  if (options.eventId !== undefined) {
    params.set("event", options.eventId);
  }
  if (options.seekMs !== undefined) {
    params.set("t", String(options.seekMs));
  }
  const search = params.toString();
  return search === "" ? path : `${path}?${search}`;
}
