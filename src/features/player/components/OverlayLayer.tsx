import { useLayoutEffect } from "react";
import { useFrameTime } from "../hooks/useFrameTime";
import { frameBoxes, type FrameBox, type OverlayTrackInput } from "../model/overlayFrame";
import type { PlayerController } from "../model/playerController";

export interface OverlayLayerProps {
  controller: PlayerController;
  /** 미리 받은 구간의 트랙(박스는 시각 순) */
  tracks: readonly OverlayTrackInput[];
  /** 박스 옆 글자. 기본은 클래스 이름이다. 쓰는 쪽이 한국어 이름으로 바꾼다. */
  formatLabel?: (box: FrameBox) => string;
}

// NFR-1: E2E가 performance.getEntriesByName으로 읽는 이름
const DRAW_MEASURE = "overlay-draw";

function percent(value: number): string {
  return `${String(value * 100)}%`;
}

/**
 * 재생 시각에 맞춘 트랙 박스 오버레이(SPEC-032 R-1). 클릭을 받지 않아 아래의 조회 층과 컨트롤이 그대로 동작한다.
 * 박스 50개도 SVG 요소 50개라 React 다시 그리기로 한 프레임(16ms) 안에 든다고 보고, 그리기 시간을 측정해 남긴다.
 */
export function OverlayLayer({ controller, tracks, formatLabel }: OverlayLayerProps) {
  const { currentMs, frameStartedAtRef } = useFrameTime(controller);
  const boxes = frameBoxes(tracks, currentMs);
  useLayoutEffect(() => {
    // 화면 갱신을 시작한 때부터 DOM 반영까지. 멈춰 있을 때는 반영 시점만 남는다.
    const end = performance.now();
    performance.measure(DRAW_MEASURE, { start: frameStartedAtRef.current ?? end, end });
    frameStartedAtRef.current = null;
  });
  return (
    <>
      <svg
        role="img"
        aria-label={`객체 박스 ${String(boxes.length)}개`}
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        {boxes.map((item) => (
          <rect
            key={item.trackId}
            x={item.box.x}
            y={item.box.y}
            width={item.box.w}
            height={item.box.h}
            vectorEffect="non-scaling-stroke"
            className={
              item.hasEvent
                ? "fill-danger/10 stroke-danger stroke-[3]"
                : "fill-none stroke-success stroke-[1.5]"
            }
          />
        ))}
      </svg>
      {boxes.map((item) => (
        <span
          key={item.trackId}
          // 박스 위치는 런타임 값이라 style로 둔다.
          style={{ left: percent(item.box.x), top: percent(item.box.y) }}
          className={`absolute -translate-y-full rounded-t px-1 text-[11px] leading-4 font-semibold whitespace-nowrap text-surface ${item.hasEvent ? "bg-danger" : "bg-success"}`}
        >
          {formatLabel?.(item) ?? item.className}
        </span>
      ))}
    </>
  );
}
