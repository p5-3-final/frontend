import {
  ZoneEditor,
  zoneSaveErrorMessage,
  type EditableZone,
  type ZoneInput,
} from "../../analysis";
import { GENERIC_ERROR_MESSAGE } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { useCameraZones } from "../api/useCameraZones";
import { usePutCameraZones } from "../api/usePutCameraZones";
import { CAMERA_ZONE_KINDS, type CameraZone, type CameraZoneList } from "../model/cameraZones";

export interface CameraZoneEditorProps {
  cameraId: string;
  /** 카메라 상세의 최근 프레임 주소(SPEC-036). 없으면 빈 배경에 그린다. */
  frameUrl?: string | null;
}

export const CAMERA_ZONE_SAVED_MESSAGE = "구역을 저장했습니다. 다음 세션부터 적용됩니다.";

function toInput(zone: CameraZone): ZoneInput {
  return {
    zoneId: zone.zoneId,
    name: zone.name,
    kind: zone.kind,
    polygon: zone.polygon.map(([x, y]) => ({ x, y })),
  };
}

function toCameraZone(zone: EditableZone): CameraZone {
  return {
    // 계약: 새 구역은 클라이언트가 UUID를 만든다. 같은 ID면 갱신이다.
    zoneId: zone.zoneId ?? crypto.randomUUID(),
    name: zone.name.trim(),
    kind: zone.kind,
    polygon: zone.polygon.map((point) => [point.x, point.y]),
  };
}

/**
 * 카메라 구역 편집(SPEC-032 R-16). 업로드 영상과 같은 편집기·저장 조건을 쓰고 stream-service에 저장한다.
 * 진행 중 세션은 시작 때의 구역을 유지하므로 저장 뒤 "다음 세션부터 적용"을 안내한다.
 */
export function CameraZoneEditor({ cameraId, frameUrl = null }: CameraZoneEditorProps) {
  const zones = useCameraZones(cameraId);
  const put = usePutCameraZones(cameraId);
  if (zones.isPending) {
    return <p className="text-sm text-muted">구역을 불러오는 중입니다.</p>;
  }
  if (zones.error !== null) {
    return <Alert>{GENERIC_ERROR_MESSAGE}</Alert>;
  }
  const save = async (edited: readonly EditableZone[]) => {
    const list: CameraZoneList = {
      zones: edited.map(toCameraZone),
      updatedAt: zones.data.updatedAt,
    };
    const saved = await put.mutateAsync(list);
    return saved.zones.map(toInput);
  };
  return (
    <ZoneEditor
      zones={zones.data.zones.map(toInput)}
      kinds={CAMERA_ZONE_KINDS}
      onSave={save}
      savedMessage={CAMERA_ZONE_SAVED_MESSAGE}
      describeError={(error) => zoneSaveErrorMessage(error, GENERIC_ERROR_MESSAGE)}
      backgroundUrl={frameUrl}
      backgroundLabel="카메라 최근 프레임"
    />
  );
}
