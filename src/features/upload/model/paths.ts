/** 내 영상 목록이 있는 영상 분석 화면 주소 */
export const VIDEO_LIST_PATH = "/analysis";

/** 영상 상세 화면 주소(SPEC-006 R-6). */
export function videoDetailPath(videoId: string) {
  return `${VIDEO_LIST_PATH}/videos/${videoId}`;
}
