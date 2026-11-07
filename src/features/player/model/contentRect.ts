/** `<video>` 안에서 영상이 실제로 그려진 영역(레터박스 제외). 단위는 px이고 기준은 플레이어 묶음 요소다. */
export interface ContentRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 프레임 크기로 나눈 0~1 좌표, 왼쪽 위 기준(계약 NormBox·polygon과 같다). */
export interface FramePoint {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

/**
 * `object-fit: contain`(기본)으로 그린 영상의 표시 영역(SPEC-032 R-14).
 * 영상 비율과 요소 비율이 다르면 위아래나 좌우에 빈 띠가 생기므로 그 띠를 뺀다. 메타데이터 전이면 null이다.
 */
export function computeContentRect(box: Size, media: Size): ContentRect | null {
  if (media.width <= 0 || media.height <= 0 || box.width <= 0 || box.height <= 0) {
    return null;
  }
  const scale = Math.min(box.width / media.width, box.height / media.height);
  const width = media.width * scale;
  const height = media.height * scale;
  return { left: (box.width - width) / 2, top: (box.height - height) / 2, width, height };
}

/** 표시 영역 기준 좌표(px)를 0~1 좌표로 바꾼다. 빈 띠를 누르면 null이다(R-3). */
export function toFramePoint(
  rect: ContentRect,
  offsetX: number,
  offsetY: number,
): FramePoint | null {
  const x = (offsetX - rect.left) / rect.width;
  const y = (offsetY - rect.top) / rect.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) {
    return null;
  }
  return { x, y };
}

/** 0~1 범위로 자른다. 끌기로 꼭짓점을 영역 밖까지 옮겨도 계약 범위를 지킨다. */
export function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}
