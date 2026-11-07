import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { ZONE_KIND_NAMES } from "../../../shared/lib/messages";
import type { ZoneAction, ZoneDraft, ZonePoint } from "../model/zoneDraft";
import { polygonCenter } from "../model/zoneGeometry";
import { ZONE_KIND_STYLES } from "../model/zoneStyles";

export interface ZoneCanvasProps {
  draft: ZoneDraft;
  onAction: (action: ZoneAction) => void;
  /** 화면 좌표를 0~1 좌표로. 그리는 영역 밖이면 null이다. */
  toPoint: (clientX: number, clientY: number) => ZonePoint | null;
  /** 화면 좌표를 0~1 범위로 잘라 바꾼다(끌기). */
  toClampedPoint: (clientX: number, clientY: number) => ZonePoint;
}

// 키보드로 꼭짓점을 옮기는 간격(plan 4절): 화살표 1%, Shift+화살표 0.1%
const STEP = 0.01;
const FINE_STEP = 0.001;
const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** 정지 프레임 위 구역 다각형과 고른 구역의 꼭짓점(SPEC-032 R-10, R-11). 부모가 그릴 영역을 꽉 채운다. */
export function ZoneCanvas({ draft, onAction, toPoint, toClampedPoint }: ZoneCanvasProps) {
  const dragging = useRef<number | null>(null);
  const selected = draft.zones.find((zone) => zone.key === draft.selectedKey);

  const handleSurfaceClick = (event: MouseEvent<HTMLButtonElement>) => {
    const point = toPoint(event.clientX, event.clientY);
    if (point !== null) {
      onAction({ type: "addVertex", point });
    }
  };

  const handlePointerDown = (index: number) => (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = index;
    onAction({ type: "selectVertex", index });
  };
  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragging.current !== null) {
      onAction({
        type: "moveVertex",
        index: dragging.current,
        point: toClampedPoint(event.clientX, event.clientY),
      });
    }
  };
  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragging.current = null;
  };
  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const arrow = ARROWS[event.key];
    if (arrow !== undefined) {
      event.preventDefault();
      const step = event.shiftKey ? FINE_STEP : STEP;
      onAction({ type: "nudgeVertex", index, dx: arrow[0] * step, dy: arrow[1] * step });
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onAction({ type: "removeVertex", index });
    }
  };

  return (
    <div role="group" aria-label="구역 그리기" className="pointer-events-auto absolute inset-0">
      {selected !== undefined && (
        <button
          type="button"
          // 마우스·터치 전용. 키보드는 편집 패널의 "꼭짓점 추가"를 쓴다.
          tabIndex={-1}
          aria-label="누른 위치에 꼭짓점 추가"
          onClick={handleSurfaceClick}
          className="absolute inset-0 cursor-crosshair"
        />
      )}
      <svg
        aria-hidden="true"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full"
      >
        {draft.zones.map((zone) => (
          <polygon
            key={zone.key}
            points={zone.polygon.map((point) => `${String(point.x)},${String(point.y)}`).join(" ")}
            vectorEffect="non-scaling-stroke"
            className={`${ZONE_KIND_STYLES[zone.kind].shape} ${zone.key === draft.selectedKey ? "stroke-[3]" : "stroke-[1.5]"}`}
          />
        ))}
      </svg>
      {draft.zones.map((zone) => {
        const center = polygonCenter(zone.polygon);
        return (
          <span
            key={zone.key}
            // 다각형 중심은 런타임 값이라 style로 둔다.
            style={{ left: `${String(center.x * 100)}%`, top: `${String(center.y * 100)}%` }}
            className={`pointer-events-none absolute -translate-1/2 rounded px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-surface ${ZONE_KIND_STYLES[zone.kind].label}`}
          >
            {`${zone.name.trim() === "" ? "이름 없음" : zone.name} · ${ZONE_KIND_NAMES[zone.kind]}`}
          </span>
        );
      })}
      {selected?.polygon.map((point, index) => (
        <button
          // 꼭짓점은 순서가 곧 정체라 번호를 key로 쓴다.
          key={index}
          type="button"
          aria-label={`꼭짓점 ${String(index + 1)}`}
          aria-pressed={draft.selectedVertex === index}
          onPointerDown={handlePointerDown(index)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown(index)}
          style={{ left: `${String(point.x * 100)}%`, top: `${String(point.y * 100)}%` }}
          className="absolute size-4 -translate-1/2 cursor-move touch-none rounded-full border-2 border-surface bg-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-pressed:bg-accent"
        />
      ))}
    </div>
  );
}
