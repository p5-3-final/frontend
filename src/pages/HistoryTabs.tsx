import { NavLink } from "react-router";
import { CAMERAS_PATH } from "../features/cameras";
import { HISTORY_PATH } from "../features/sessions";

const TABS = [
  { to: HISTORY_PATH, label: "작업 세션", end: true },
  { to: CAMERAS_PATH, label: "카메라", end: false },
] as const;

/** "분석 이력" 아래 두 화면(작업 세션, 카메라) 사이를 오가는 탭(SPEC-034 plan 9절). */
export function HistoryTabs() {
  return (
    <nav aria-label="분석 이력 보기" className="flex gap-1 border-b border-line">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `-mb-px border-b-2 px-4 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
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
