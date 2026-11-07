import { clampUnit } from "../../player";

/** 구역 종류. 업로드 영상(analysis)은 hazard·aisle·general, 카메라(stream)는 storage까지 쓴다. */
export type ZoneKind = "hazard" | "aisle" | "general" | "storage";

export interface ZonePoint {
  x: number;
  y: number;
}

/** 편집 중인 구역. `key`는 화면 안에서만 쓰는 식별자이고, 새 구역은 `zoneId`가 null이다. */
export interface EditableZone {
  key: string;
  zoneId: string | null;
  name: string;
  kind: ZoneKind;
  polygon: ZonePoint[];
}

/** 저장된 구역(편집 전). 계약마다 형식이 달라 쓰는 쪽이 이 모양으로 바꿔 넘긴다. */
export type ZoneInput = Omit<EditableZone, "key">;

/** 저장 결과 안내. 성공 문구("다음 분석부터 반영됨" 등)는 쓰는 쪽이 정한다. */
export interface ZoneSaveNotice {
  tone: "success" | "danger";
  text: string;
}

export interface ZoneDraft {
  zones: EditableZone[];
  selectedKey: string | null;
  /** 고른 구역 안에서 고른 꼭짓점 번호 */
  selectedVertex: number | null;
  /** 새 구역 key를 만들 때 쓰는 순번 */
  nextKey: number;
}

export type ZoneAction =
  | { type: "selectZone"; key: string }
  | { type: "addZone"; kind: ZoneKind }
  | { type: "removeZone" }
  | { type: "rename"; name: string }
  | { type: "setKind"; kind: ZoneKind }
  | { type: "addVertex"; point: ZonePoint }
  | { type: "selectVertex"; index: number }
  | { type: "moveVertex"; index: number; point: ZonePoint }
  | { type: "nudgeVertex"; index: number; dx: number; dy: number }
  /** `index`가 없으면 고른 꼭짓점을 지운다. */
  | { type: "removeVertex"; index?: number };

/** 저장된 구역으로 편집 상태를 만든다. 첫 구역을 고른 상태로 시작한다. */
export function createZoneDraft(zones: readonly ZoneInput[]): ZoneDraft {
  const editable = zones.map((zone, index) => ({
    ...zone,
    polygon: [...zone.polygon],
    key: `zone-${String(index)}`,
  }));
  return {
    zones: editable,
    selectedKey: editable[0]?.key ?? null,
    selectedVertex: null,
    nextKey: editable.length,
  };
}

export function selectedZone(draft: ZoneDraft): EditableZone | undefined {
  return draft.zones.find((zone) => zone.key === draft.selectedKey);
}

function updateSelected(draft: ZoneDraft, update: (zone: EditableZone) => EditableZone): ZoneDraft {
  return {
    ...draft,
    zones: draft.zones.map((zone) => (zone.key === draft.selectedKey ? update(zone) : zone)),
  };
}

function withPoint(polygon: readonly ZonePoint[], index: number, point: ZonePoint): ZonePoint[] {
  return polygon.map((current, i) =>
    i === index ? { x: clampUnit(point.x), y: clampUnit(point.y) } : current,
  );
}

/** 편집 동작 하나를 적용한 새 상태(R-11). 원래 상태는 바꾸지 않는다. */
export function reduceZoneDraft(draft: ZoneDraft, action: ZoneAction): ZoneDraft {
  switch (action.type) {
    case "selectZone":
      return { ...draft, selectedKey: action.key, selectedVertex: null };
    case "addZone": {
      const key = `zone-${String(draft.nextKey)}`;
      const zone: EditableZone = { key, zoneId: null, name: "", kind: action.kind, polygon: [] };
      return {
        zones: [...draft.zones, zone],
        selectedKey: key,
        selectedVertex: null,
        nextKey: draft.nextKey + 1,
      };
    }
    case "removeZone": {
      const zones = draft.zones.filter((zone) => zone.key !== draft.selectedKey);
      return { ...draft, zones, selectedKey: zones[0]?.key ?? null, selectedVertex: null };
    }
    case "rename":
      return updateSelected(draft, (zone) => ({ ...zone, name: action.name }));
    case "setKind":
      return updateSelected(draft, (zone) => ({ ...zone, kind: action.kind }));
    case "addVertex": {
      // 마지막 꼭짓점 뒤에 붙인다. 고른 꼭짓점은 새 꼭짓점으로 옮겨 이어서 끌 수 있게 한다.
      const zone = selectedZone(draft);
      if (zone === undefined) {
        return draft;
      }
      const point = { x: clampUnit(action.point.x), y: clampUnit(action.point.y) };
      return {
        ...updateSelected(draft, (current) => ({
          ...current,
          polygon: [...current.polygon, point],
        })),
        selectedVertex: zone.polygon.length,
      };
    }
    case "selectVertex":
      return { ...draft, selectedVertex: action.index };
    case "moveVertex":
      return updateSelected(draft, (zone) => ({
        ...zone,
        polygon: withPoint(zone.polygon, action.index, action.point),
      }));
    case "nudgeVertex":
      return updateSelected(draft, (zone) => {
        const point = zone.polygon[action.index];
        return point === undefined
          ? zone
          : {
              ...zone,
              polygon: withPoint(zone.polygon, action.index, {
                x: point.x + action.dx,
                y: point.y + action.dy,
              }),
            };
      });
    case "removeVertex": {
      const index = action.index ?? draft.selectedVertex;
      if (index === null) {
        return draft;
      }
      return {
        ...updateSelected(draft, (zone) => ({
          ...zone,
          polygon: zone.polygon.filter((_, i) => i !== index),
        })),
        selectedVertex: null,
      };
    }
  }
}
