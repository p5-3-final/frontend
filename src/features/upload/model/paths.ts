/** 내 영상 목록이 있는 영상 분석 화면 주소 */
export const VIDEO_LIST_PATH = "/analysis";

/** 영상 상세 화면 주소(SPEC-006 R-6). `eventId`를 주면 그 이벤트가 열린 상태로 연다(SPEC-031 R-11). */
export function videoDetailPath(videoId: string, options: { eventId?: string } = {}) {
  const path = `${VIDEO_LIST_PATH}/videos/${videoId}`;
  return options.eventId === undefined
    ? path
    : `${path}?${new URLSearchParams({ event: options.eventId }).toString()}`;
}
