import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { nearestFrame } from "../model/frames";
import type { GroundingClip } from "../model/schemas";

export interface GroundingClipDialogProps {
  clip: GroundingClip;
  /** 클립 URL. 서명 주소라 창이 열린 동안만 쓴다. */
  clipUrl: string;
  /** 클립이 시작하는 원본 영상 시각. 결과 구간의 startMs다. */
  clipStartMs: number;
  onClose: () => void;
}

/**
 * bbox 주석 클립 창(SPEC-033 R-6). 대상어별 색 범례와 현재 재생 위치의 프레임별 객체 수를 함께 보인다.
 * 프레임 시각(ptsMs)은 원본 영상 기준이라 클립 재생 위치에 clipStartMs를 더해 가장 가까운 프레임을 고른다.
 */
export function GroundingClipDialog({
  clip,
  clipUrl,
  clipStartMs,
  onClose,
}: GroundingClipDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [atMs, setAtMs] = useState(clipStartMs);
  const frame = nearestFrame(clip.frames, atMs);

  // showModal은 DOM API라서 그린 뒤에 부른다(ConfirmDialog와 같다).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog?.open === true) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape로 닫힐 때도 부모 상태가 바뀌도록 브라우저가 직접 닫지 않게 한다.
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(48rem,calc(100vw-2rem))] rounded-2xl border border-line bg-panel p-5 text-content backdrop:bg-surface/70"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-lg font-bold">
          주석 클립
        </h2>
        <Button variant="secondary" className="h-9 px-3" onClick={onClose}>
          <X aria-hidden="true" className="size-4" />
          닫기
        </Button>
      </div>
      <video
        src={clipUrl}
        controls
        autoPlay
        muted
        playsInline
        aria-label="주석 클립 재생"
        className="mt-4 aspect-video w-full rounded-lg bg-surface"
        onTimeUpdate={(event) => {
          setAtMs(clipStartMs + Math.round(event.currentTarget.currentTime * 1000));
        }}
      />
      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-muted">대상어 색</h3>
          <ul aria-label="대상어 색" className="flex flex-col gap-1.5">
            {clip.targets.map((target) => (
              <li key={target} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-3 shrink-0 rounded-sm border border-line"
                  // 색은 서버가 대상어마다 정한 값이라 런타임에만 안다.
                  style={{ backgroundColor: clip.colors[target] }}
                />
                {target}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-muted">현재 프레임 객체 수</h3>
          {frame === undefined ? (
            <p className="text-muted">프레임 정보가 없습니다.</p>
          ) : (
            <ul aria-label="프레임별 객체 수" className="flex flex-col gap-1.5 tabular-nums">
              {clip.targets.map((target) => (
                <li key={target}>{`${target}: ${String(frame.counts[target] ?? 0)}`}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}
