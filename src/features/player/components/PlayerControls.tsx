import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { formatMediaTime } from "../../../shared/lib/format";
import { usePlayerSnapshot } from "../hooks/usePlayerController";
import { groupMarkers } from "../model/markers";
import type { PlayerController } from "../model/playerController";
import type { TimelineMarker } from "../model/types";

export interface PlayerControlsProps {
  controller: PlayerController;
  markers?: readonly TimelineMarker[];
  onMarkerSelect?: (id: string) => void;
  onFullscreen?: () => void;
}

// severity 색. 색만으로 구분하지 않게 표시 이름에도 severity를 넣는다(R-18).
const TONE_CLASSES: Readonly<Record<TimelineMarker["tone"], string>> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-accent",
  none: "bg-muted",
};

const ICON_BUTTON =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-content hover:bg-panel-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

// 기본 range의 키보드 이동(←·→)이 5초씩 움직이게 한다.
const SEEK_STEP_MS = 5000;

/**
 * 자체 플레이어 컨트롤(SPEC-031 R-4, D-23). 기본 `<video controls>`의 진행 막대에는 이벤트 표시를 그릴 수 없어 직접 만든다.
 * 표시는 Tab 순서에서 뺀다. 표시가 500개면 Tab으로 지나갈 수 없어 키보드 사용자는 이벤트 목록으로 같은 동작을 한다(R-18).
 */
export function PlayerControls({
  controller,
  markers = [],
  onMarkerSelect,
  onFullscreen,
}: PlayerControlsProps) {
  const { currentMs, durationMs, paused, muted } = usePlayerSnapshot(controller);
  const groups = groupMarkers(markers, durationMs);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-panel px-2 py-1.5">
      <button
        type="button"
        aria-label={paused ? "재생" : "일시정지"}
        onClick={() => {
          if (paused) {
            controller.play();
          } else {
            controller.pause();
          }
        }}
        className={ICON_BUTTON}
      >
        {paused ? (
          <Play aria-hidden="true" className="size-4" />
        ) : (
          <Pause aria-hidden="true" className="size-4" />
        )}
      </button>
      <div className="relative flex h-9 min-w-0 flex-1 items-center">
        <input
          type="range"
          aria-label="재생 위치"
          aria-valuetext={formatMediaTime(currentMs)}
          min={0}
          max={Math.max(durationMs, 0)}
          step={SEEK_STEP_MS}
          value={Math.min(currentMs, durationMs)}
          onChange={(event) => {
            controller.seek(Number(event.target.value));
          }}
          className="w-full accent-accent"
        />
        {groups.length > 0 && (
          <ul aria-label="이벤트 표시" className="pointer-events-none absolute inset-x-0 top-0 h-2">
            {groups.map((group) => (
              <li
                key={`${group.first.id}-${String(group.percent)}`}
                className="absolute top-0 -translate-x-1/2"
                // 위치는 영상 길이로 런타임에 계산한다(AGENTS.md 스타일 예외).
                style={{ left: `${String(group.percent)}%` }}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={
                    group.count > 1
                      ? `${group.first.label} 외 ${String(group.count - 1)}건`
                      : group.first.label
                  }
                  title={group.first.label}
                  onClick={() => {
                    onMarkerSelect?.(group.first.id);
                  }}
                  className={`pointer-events-auto block h-2.5 w-1.5 rounded-sm hover:scale-150 ${TONE_CLASSES[group.tone]}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
        {formatMediaTime(currentMs)} / {formatMediaTime(durationMs)}
      </span>
      <button
        type="button"
        aria-label={muted ? "음소거 해제" : "음소거"}
        onClick={() => {
          controller.setMuted(!muted);
        }}
        className={ICON_BUTTON}
      >
        {muted ? (
          <VolumeX aria-hidden="true" className="size-4" />
        ) : (
          <Volume2 aria-hidden="true" className="size-4" />
        )}
      </button>
      {onFullscreen !== undefined && (
        <button type="button" aria-label="전체 화면" onClick={onFullscreen} className={ICON_BUTTON}>
          <Maximize aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}
