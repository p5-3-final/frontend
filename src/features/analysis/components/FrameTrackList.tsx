import { frameBoxes, usePlayerSnapshot } from "../../player";
import { objectClassName } from "../../../shared/lib/messages";
import { useSourceOverlay } from "../api/useSourceOverlay";
import { useVideoInspect } from "../hooks/useVideoInspect";

/**
 * 클릭 조회의 키보드 대안(SPEC-032 R-3, plan 4절). 멈춘 화면에 오버레이가 켜져 있으면 지금 프레임의 박스를
 * 버튼으로 보이고, 누르면 그 박스 중심으로 같은 조회를 한다. 오버레이와 같은 query라 다시 묻지 않는다.
 */
export function FrameTrackList() {
  const { sourceId, controller, runInspect } = useVideoInspect();
  const { currentMs, paused } = usePlayerSnapshot(controller);
  const { tracks } = useSourceOverlay(sourceId, currentMs, paused);
  if (!paused) {
    return null;
  }
  const boxes = frameBoxes(tracks, currentMs);
  if (boxes.length === 0) {
    return null;
  }
  return (
    <ul aria-label="트랙 목록" className="flex flex-wrap gap-2">
      {boxes.map((item) => (
        <li key={item.trackId}>
          <button
            type="button"
            onClick={() => {
              runInspect({
                tMs: currentMs,
                x: item.box.x + item.box.w / 2,
                y: item.box.y + item.box.h / 2,
              });
            }}
            className="rounded-full border border-line bg-panel-raised px-3 py-1 text-sm hover:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {`${objectClassName(item.className)}${item.hasEvent ? " · 이벤트" : ""} 조회`}
          </button>
        </li>
      ))}
    </ul>
  );
}
