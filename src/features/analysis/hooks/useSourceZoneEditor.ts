import { useState } from "react";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { usePutSourceZones } from "../api/usePutSourceZones";
import { useSourceZones } from "../api/useSourceZones";
import type { ZoneDefinition } from "../model/inspectSchemas";
import {
  createZoneDraft,
  reduceZoneDraft,
  type EditableZone,
  type ZoneAction,
  type ZoneDraft,
  type ZoneSaveNotice,
} from "../model/zoneDraft";

export const SOURCE_ZONE_SAVED_MESSAGE =
  "구역을 저장했습니다. 다음 분석부터 반영됩니다(재분석 필요).";
export const SOURCE_ZONE_FORBIDDEN_MESSAGE = "이 영상의 구역을 바꿀 권한이 없습니다.";

/** 업로드 영상의 구역 편집 상태(SPEC-032 R-10~R-12) */
export interface SourceZoneEditor {
  /** 구역을 불러오기 전이면 null */
  draft: ZoneDraft | null;
  loadError: Error | null;
  dispatch: (action: ZoneAction) => void;
  save: () => void;
  saving: boolean;
  notice: ZoneSaveNotice | undefined;
  discard: () => void;
}

function toDefinition(zone: EditableZone): ZoneDefinition {
  return {
    zoneId: zone.zoneId,
    name: zone.name.trim(),
    // 업로드 영상 편집기는 종류 3개만 고르게 하므로 storage는 오지 않는다.
    kind: zone.kind === "storage" ? "general" : zone.kind,
    polygon: zone.polygon,
  };
}

/** R-12: 400은 서버가 준 위반 이유를, 403은 권한 안내를 보인다. */
export function zoneSaveErrorMessage(error: Error, forbidden: string): string {
  if (!(error instanceof ApiError)) {
    return messageForCode(undefined);
  }
  if (error.status === 403) {
    return forbidden;
  }
  return error.detail ?? messageForCode(error.code);
}

/**
 * 편집 중 구역은 화면 상태에만 둔다. 사용자가 고치기 전에는 서버 값에서 만들고, 저장하면 다시 서버 값으로 돌아간다.
 */
export function useSourceZoneEditor(sourceId: string, enabled: boolean): SourceZoneEditor {
  const zones = useSourceZones(sourceId, enabled);
  const mutation = usePutSourceZones(sourceId);
  const [edited, setEdited] = useState<ZoneDraft | null>(null);
  const draft = edited ?? (zones.data === undefined ? null : createZoneDraft(zones.data.items));

  let notice: ZoneSaveNotice | undefined;
  if (mutation.isSuccess) {
    notice = { tone: "success", text: SOURCE_ZONE_SAVED_MESSAGE };
  } else if (mutation.error !== null) {
    notice = {
      tone: "danger",
      text: zoneSaveErrorMessage(mutation.error, SOURCE_ZONE_FORBIDDEN_MESSAGE),
    };
  }

  return {
    draft,
    loadError: zones.error,
    dispatch: (action) => {
      if (draft === null) {
        return;
      }
      // 한 이벤트에서 동작이 이어 와도(끌기 중 여러 번 옮기기) 앞 결과에 이어 적용한다.
      setEdited((previous) => reduceZoneDraft(previous ?? draft, action));
      mutation.reset();
    },
    save: () => {
      if (draft === null) {
        return;
      }
      mutation.mutate(draft.zones.map(toDefinition), {
        onSuccess: () => {
          setEdited(null);
        },
      });
    },
    saving: mutation.isPending,
    notice,
    discard: () => {
      setEdited(null);
      mutation.reset();
    },
  };
}
