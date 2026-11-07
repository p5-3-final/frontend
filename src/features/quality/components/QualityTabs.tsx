import { NavLink } from "react-router";

export const QUALITY_TABS = [
  { path: "/quality/review", label: "검토 큐" },
  { path: "/quality/golden-sets", label: "Golden Set" },
  { path: "/quality/runs", label: "평가 실행" },
  { path: "/quality/stages", label: "처리 단계" },
  { path: "/quality/datasets", label: "데이터셋" },
] as const;

/** 품질 하위 화면 탭(SPEC-035 2절). 현재 탭은 NavLink가 aria-current="page"로 표시한다. */
export function QualityTabs() {
  return (
    <nav aria-label="품질 메뉴" className="flex gap-1 overflow-x-auto border-b border-line">
      {QUALITY_TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `-mb-px border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-content"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
