import { InspectLayer } from "../../player";
import { useVideoInspect } from "../hooks/useVideoInspect";

/** 플레이어 `overlay` 자리에 넣는 층 묶음(SPEC-032). 클릭 조회 결과 박스와 조회 층을 그린다. */
export function VideoInspectLayers() {
  const { controller, inspect, runInspect } = useVideoInspect();
  const box = inspect.status === "hit" ? inspect.result.box : null;
  return (
    <>
      {box !== null && (
        <svg
          role="img"
          aria-label="선택한 객체 위치"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
        >
          <rect
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            vectorEffect="non-scaling-stroke"
            className="fill-accent/15 stroke-accent stroke-[3]"
          />
        </svg>
      )}
      <InspectLayer controller={controller} onInspect={runInspect} />
    </>
  );
}
