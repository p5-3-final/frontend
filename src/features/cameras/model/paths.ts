/** 카메라 목록 주소(SPEC-034 R-13, "분석 이력"의 카메라 탭) */
export const CAMERAS_PATH = "/history/cameras";

export function cameraDetailPath(cameraId: string): string {
  return `${CAMERAS_PATH}/${cameraId}`;
}
