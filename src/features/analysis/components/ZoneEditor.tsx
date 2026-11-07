import { useRef, useState } from "react";
import { clampUnit } from "../../player";
import {
  createZoneDraft,
  reduceZoneDraft,
  type EditableZone,
  type ZoneAction,
  type ZoneInput,
  type ZoneKind,
  type ZoneSaveNotice,
} from "../model/zoneDraft";
import { ZoneCanvas } from "./ZoneCanvas";
import { ZoneEditorPanel } from "./ZoneEditorPanel";

export interface ZoneEditorProps {
  /** 저장된 구역. 편집기는 이 값으로 시작하고, 저장하면 저장 응답으로 다시 시작한다. */
  zones: readonly ZoneInput[];
  kinds: readonly ZoneKind[];
  /** 구역 목록 전체를 저장하고 저장된 구역을 돌려준다(쓰는 쪽이 계약 형식으로 바꾼다). */
  onSave: (zones: readonly EditableZone[]) => Promise<readonly ZoneInput[]>;
  /** 저장 뒤 안내. 예: "다음 세션부터 적용됩니다." */
  savedMessage: string;
  describeError: (error: Error) => string;
  /** 배경 프레임 주소. 없으면 빈 배경에 그린다. */
  backgroundUrl: string | null;
  backgroundLabel: string;
}

/**
 * 배경 프레임 위에 구역을 그리는 편집기(SPEC-032 R-11, R-16). 업로드 영상은 플레이어 위에 같은 그리기 층과
 * 편집 패널을 따로 놓고(`VideoInspectLayers`), 플레이어가 없는 화면(카메라)은 이 컴포넌트를 쓴다.
 */
export function ZoneEditor({
  zones,
  kinds,
  onSave,
  savedMessage,
  describeError,
  backgroundUrl,
  backgroundLabel,
}: ZoneEditorProps) {
  const [draft, setDraft] = useState(() => createZoneDraft(zones));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<ZoneSaveNotice | undefined>();
  const surfaceRef = useRef<HTMLDivElement>(null);

  const dispatch = (action: ZoneAction) => {
    setDraft((previous) => reduceZoneDraft(previous, action));
    setNotice(undefined);
  };
  const toClampedPoint = (clientX: number, clientY: number) => {
    const box = surfaceRef.current?.getBoundingClientRect();
    if (box === undefined || box.width === 0 || box.height === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: clampUnit((clientX - box.left) / box.width),
      y: clampUnit((clientY - box.top) / box.height),
    };
  };
  const save = () => {
    setSaving(true);
    onSave(draft.zones).then(
      (saved) => {
        setDraft(createZoneDraft(saved));
        setNotice({ tone: "success", text: savedMessage });
        setSaving(false);
      },
      (error: unknown) => {
        setNotice({
          tone: "danger",
          text: describeError(error instanceof Error ? error : new Error(String(error))),
        });
        setSaving(false);
      },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div ref={surfaceRef} className="relative aspect-video overflow-hidden rounded-xl bg-black">
        {backgroundUrl === null ? (
          <p className="absolute inset-x-0 top-2 text-center text-xs text-muted">
            최근 프레임이 없어 빈 배경에 그립니다.
          </p>
        ) : (
          // 좌표는 프레임 전체 기준(0~1)이라 비율을 지키지 않고 상자를 꽉 채운다. 카메라 프레임은 16:9로 본다.
          <img src={backgroundUrl} alt={backgroundLabel} className="size-full object-fill" />
        )}
        <ZoneCanvas
          draft={draft}
          onAction={dispatch}
          toPoint={toClampedPoint}
          toClampedPoint={toClampedPoint}
        />
      </div>
      <ZoneEditorPanel
        draft={draft}
        onAction={dispatch}
        kinds={kinds}
        onSave={save}
        saving={saving}
        notice={notice}
      />
    </div>
  );
}
