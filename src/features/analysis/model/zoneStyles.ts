import type { ZoneKind } from "./zoneDraft";

/** 구역 종류별 색(SPEC-032 R-10). 색만으로 구분하지 않도록 이름 옆에 종류 글자도 함께 보인다. */
export const ZONE_KIND_STYLES: Readonly<
  Record<ZoneKind, { shape: string; label: string; swatch: string }>
> = {
  hazard: { shape: "fill-danger/20 stroke-danger", label: "bg-danger", swatch: "bg-danger" },
  aisle: {
    shape: "fill-zone-aisle/20 stroke-zone-aisle",
    label: "bg-zone-aisle",
    swatch: "bg-zone-aisle",
  },
  general: {
    shape: "fill-zone-general/20 stroke-zone-general",
    label: "bg-zone-general",
    swatch: "bg-zone-general",
  },
  storage: { shape: "fill-warning/20 stroke-warning", label: "bg-warning", swatch: "bg-warning" },
};
