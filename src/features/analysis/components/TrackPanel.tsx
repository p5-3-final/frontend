import { X } from "lucide-react";
import type { PlayerController } from "../../player";
import { formatMediaTime } from "../../../shared/lib/format";
import {
  objectClassName,
  PPE_STATE_NAMES,
  VERIFICATION_NAMES,
  workerRoleName,
} from "../../../shared/lib/messages";
import { Panel } from "../../../shared/ui/Panel";
import { useTrack } from "../api/useTrack";
import { useTrackLiveRefresh } from "../hooks/useTrackLiveRefresh";
import { TrackQuestions } from "./TrackQuestions";
import type { Track, TrackAttribute } from "../model/inspectSchemas";

export interface TrackPanelProps {
  sourceId: string;
  track: Track;
  controller: PlayerController;
  onClose: () => void;
}

/** 클릭 조회로 찾은 트랙 패널(SPEC-032 R-4). 클래스·등장 구간·속성 상태를 보인다. */
export function TrackPanel({ sourceId, track: initial, controller, onClose }: TrackPanelProps) {
  const { data: track } = useTrack(initial.trackId, initial);
  useTrackLiveRefresh(sourceId, initial.trackId);
  return (
    <Panel
      title="트랙 정보"
      aside={
        <button
          type="button"
          aria-label="트랙 정보 닫기"
          onClick={onClose}
          className="rounded-md p-1 text-muted hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-lg font-semibold">{objectClassName(track.className)}</span>
        <button
          type="button"
          onClick={() => {
            controller.seek(track.startMs);
          }}
          aria-label={`등장 구간 ${formatMediaTime(track.startMs)} ~ ${formatMediaTime(track.endMs)}, 처음 시각으로 이동`}
          className="rounded-full border border-line bg-panel-raised px-3 py-1 font-mono text-xs text-accent hover:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {`${formatMediaTime(track.startMs)} ~ ${formatMediaTime(track.endMs)}`}
        </button>
      </div>
      <AttributeSection track={track} />
      <TrackQuestions sourceId={sourceId} trackId={track.trackId} controller={controller} />
    </Panel>
  );
}

function AttributeSection({ track }: { track: Track }) {
  if (track.attributeStatus === "FAILED") {
    return <p className="text-sm text-danger">속성을 분석하지 못했습니다.</p>;
  }
  if (track.attributeStatus !== "READY" || track.attributes === null) {
    // NONE도 서버가 속성 분석을 요청한 상태라 같게 본다(계약 inspectPoint 설명).
    return (
      <p role="status" className="text-sm text-muted">
        속성 분석 중
      </p>
    );
  }
  return <AttributeFacts attributes={track.attributes} />;
}

function AttributeFacts({ attributes }: { attributes: TrackAttribute }) {
  const facts = [
    ["안전모", attributes.helmet === null ? "-" : PPE_STATE_NAMES[attributes.helmet]],
    ["안전조끼", attributes.vest === null ? "-" : PPE_STATE_NAMES[attributes.vest]],
    ["역할", attributes.role === null ? "-" : workerRoleName(attributes.role)],
    [
      "장비",
      attributes.equipment.length === 0
        ? "없음"
        : attributes.equipment.map(objectClassName).join(", "),
    ],
    ["판정 상태", VERIFICATION_NAMES[attributes.verificationStatus]],
  ] as const;
  return (
    <div className="flex flex-col gap-2">
      <dl aria-label="트랙 속성" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {facts.map(([term, value]) => (
          <div
            key={term}
            role="group"
            aria-label={term}
            className="flex flex-col rounded-lg bg-panel-raised px-3 py-2"
          >
            <dt className="text-xs text-muted">{term}</dt>
            <dd className="text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      {attributes.description !== null && (
        <p className="text-sm leading-relaxed">{attributes.description}</p>
      )}
    </div>
  );
}
