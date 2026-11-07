import { useEffect, useState } from "react";
import { computeContentRect, type ContentRect } from "../model/contentRect";

function measure(video: HTMLVideoElement): ContentRect | null {
  return computeContentRect(
    { width: video.clientWidth, height: video.clientHeight },
    { width: video.videoWidth, height: video.videoHeight },
  );
}

function sameRect(a: ContentRect | null, b: ContentRect | null): boolean {
  return (
    a === b ||
    (a !== null &&
      b !== null &&
      a.left === b.left &&
      a.top === b.top &&
      a.width === b.width &&
      a.height === b.height)
  );
}

/**
 * `<video>`의 표시 영역(레터박스 제외, 요소 기준 px). 메타데이터를 읽거나 요소 크기가 바뀌면 다시 계산한다(SPEC-032 R-14).
 * 메타데이터 전이면 null이다.
 */
export function useVideoContentRect(video: HTMLVideoElement | null): ContentRect | null {
  const [rect, setRect] = useState<ContentRect | null>(null);
  useEffect(() => {
    if (video === null) {
      return;
    }
    const update = () => {
      const next = measure(video);
      setRect((previous) => (sameRect(previous, next) ? previous : next));
    };
    update();
    // 창 크기 변경, 전체 화면 전환, 패널이 열려 레이아웃이 바뀐 경우 모두 요소 크기 변화로 잡힌다.
    const observer = new ResizeObserver(update);
    observer.observe(video);
    video.addEventListener("loadedmetadata", update);
    video.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", update);
      video.removeEventListener("resize", update);
    };
  }, [video]);
  return video === null ? null : rect;
}
