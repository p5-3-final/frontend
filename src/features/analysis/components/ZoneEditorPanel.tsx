import { useId } from "react";
import { ZONE_KIND_NAMES } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import { TextField } from "../../../shared/ui/TextField";
import {
  selectedZone,
  type ZoneAction,
  type ZoneDraft,
  type ZoneKind,
  type ZoneSaveNotice,
} from "../model/zoneDraft";
import { zoneViolations } from "../model/zoneRules";
import { ZONE_KIND_STYLES } from "../model/zoneStyles";

export interface ZoneEditorPanelProps {
  draft: ZoneDraft;
  onAction: (action: ZoneAction) => void;
  /** 고를 수 있는 구역 종류. 업로드 영상은 3종, 카메라는 적치구역까지 4종이다. */
  kinds: readonly ZoneKind[];
  onSave: () => void;
  saving: boolean;
  notice?: ZoneSaveNotice | undefined;
  onClose?: () => void;
}

// 키보드로 꼭짓점을 더할 때 마지막 꼭짓점에서 떨어뜨리는 거리(0~1 좌표)
const KEYBOARD_VERTEX_OFFSET = 0.05;

/** 구역 목록·이름·종류·꼭짓점 조작과 저장(SPEC-032 R-11, R-12). 조건을 어기면 저장을 막고 이유를 보인다. */
export function ZoneEditorPanel({
  draft,
  onAction,
  kinds,
  onSave,
  saving,
  notice,
  onClose,
}: ZoneEditorPanelProps) {
  const violations = zoneViolations(draft.zones);
  const zone = selectedZone(draft);
  const kindId = useId();
  const reasonsId = useId();
  const last = zone?.polygon.at(-1);
  return (
    <Panel
      title="위험구역 편집"
      aside={
        onClose === undefined ? undefined : (
          <Button variant="secondary" onClick={onClose} className="h-9">
            편집 닫기
          </Button>
        )
      }
    >
      <p className="text-sm text-muted">
        구역을 고르고 영상 위를 눌러 꼭짓점을 더합니다. 꼭짓점은 끌거나 화살표 키로 옮기고 Delete로
        지웁니다.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <ul aria-label="구역 목록" className="flex flex-wrap gap-2">
          {draft.zones.map((item, index) => (
            <li key={item.key}>
              <button
                type="button"
                aria-pressed={item.key === draft.selectedKey}
                onClick={() => {
                  onAction({ type: "selectZone", key: item.key });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-raised px-3 py-1 text-sm hover:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-pressed:border-accent aria-pressed:text-accent"
              >
                <span
                  aria-hidden="true"
                  className={`size-2.5 rounded-full ${ZONE_KIND_STYLES[item.kind].swatch}`}
                />
                {item.name.trim() === "" ? `${String(index + 1)}번째 구역` : item.name}
              </button>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          className="h-9"
          onClick={() => {
            onAction({ type: "addZone", kind: kinds[0] ?? "hazard" });
          }}
        >
          새 구역
        </Button>
      </div>
      {zone !== undefined && (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <TextField
            label="구역 이름"
            value={zone.name}
            maxLength={200}
            onChange={(event) => {
              onAction({ type: "rename", name: event.target.value });
            }}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={kindId} className="text-sm font-medium text-muted">
              구역 종류
            </label>
            <select
              id={kindId}
              value={zone.kind}
              onChange={(event) => {
                const kind = kinds.find((item) => item === event.target.value);
                if (kind !== undefined) {
                  onAction({ type: "setKind", kind });
                }
              }}
              className="h-11 rounded-lg border border-line bg-surface px-3 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              {kinds.map((kind) => (
                <option key={kind} value={kind}>
                  {ZONE_KIND_NAMES[kind]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button
              variant="secondary"
              className="h-9"
              onClick={() => {
                onAction({
                  type: "addVertex",
                  point:
                    last === undefined
                      ? { x: 0.5, y: 0.5 }
                      : { x: last.x + KEYBOARD_VERTEX_OFFSET, y: last.y + KEYBOARD_VERTEX_OFFSET },
                });
              }}
            >
              꼭짓점 추가
            </Button>
            <Button
              variant="secondary"
              className="h-9"
              disabled={draft.selectedVertex === null}
              onClick={() => {
                onAction({ type: "removeVertex" });
              }}
            >
              꼭짓점 지우기
            </Button>
            <Button
              variant="danger"
              className="h-9"
              onClick={() => {
                onAction({ type: "removeZone" });
              }}
            >
              구역 지우기
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <Button
          onClick={onSave}
          disabled={violations.length > 0 || saving}
          aria-describedby={violations.length > 0 ? reasonsId : undefined}
        >
          {saving ? "저장 중" : "구역 저장"}
        </Button>
        {violations.length > 0 && (
          <ul
            id={reasonsId}
            aria-label="저장할 수 없는 이유"
            className="flex flex-col gap-0.5 text-sm text-danger"
          >
            {violations.map((reason, index) => (
              <li key={`${String(index)}-${reason}`}>{reason}</li>
            ))}
          </ul>
        )}
      </div>
      {notice !== undefined && <Alert tone={notice.tone}>{notice.text}</Alert>}
    </Panel>
  );
}
