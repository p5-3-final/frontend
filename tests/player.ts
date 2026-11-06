import { act, fireEvent } from "@testing-library/react";
import { resizeObservedForTest } from "./resizeObserver";

/** 영상 크기와 요소 크기. jsdom은 레이아웃이 없어 테스트가 정한다. */
export interface VideoLayout {
  width: number;
  height: number;
  videoWidth: number;
  videoHeight: number;
}

function define(video: HTMLVideoElement, layout: VideoLayout) {
  for (const [key, value] of [
    ["clientWidth", layout.width],
    ["clientHeight", layout.height],
    ["videoWidth", layout.videoWidth],
    ["videoHeight", layout.videoHeight],
  ] as const) {
    Object.defineProperty(video, key, { configurable: true, value });
  }
}

/** 기본은 800×600 요소에 16:9 영상(위아래 75px 빈 띠, 표시 영역 800×450)이다. */
export const DEFAULT_LAYOUT: VideoLayout = {
  width: 800,
  height: 600,
  videoWidth: 1600,
  videoHeight: 900,
};

/** `<video>`의 크기를 정하고 메타데이터를 읽은 것처럼 알린다. */
export function layoutVideo(video: HTMLVideoElement, layout: VideoLayout = DEFAULT_LAYOUT) {
  define(video, layout);
  fireEvent(video, new Event("loadedmetadata"));
}

/** 요소 크기를 바꾸고 ResizeObserver 콜백을 부른다(창 크기 변경). */
export function resizeVideo(video: HTMLVideoElement, layout: VideoLayout) {
  define(video, layout);
  act(() => {
    resizeObservedForTest();
  });
}

/** 재생 중인 것처럼 `paused`를 false로 두고 play 이벤트를 보낸다(jsdom은 실제로 재생하지 않는다). */
export function startPlaying(video: HTMLVideoElement) {
  Object.defineProperty(video, "paused", { configurable: true, value: false });
  fireEvent(video, new Event("play"));
}

/** 재생 위치를 정하고 seeked를 알린다. */
export function seekVideo(video: HTMLVideoElement, seconds: number) {
  video.currentTime = seconds;
  fireEvent(video, new Event("seeked"));
}
