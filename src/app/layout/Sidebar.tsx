import { NavLink } from "react-router";
import { MAIN_MENU, SETTINGS_MENU, type MenuItem } from "./menu";

function MenuLink({ item, onNavigate }: { item: MenuItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex h-12 items-center gap-3 rounded-lg px-4 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
          isActive
            ? "bg-accent-soft text-accent"
            : "text-muted hover:bg-panel-raised hover:text-content"
        }`
      }
    >
      <Icon aria-hidden="true" className="size-5" />
      {item.label}
    </NavLink>
  );
}

/** 왼쪽 메뉴. 현재 화면의 메뉴는 NavLink가 aria-current="page"로 표시한다(SPEC-002 R-14). */
export interface SidebarProps {
  /** 메뉴를 고른 뒤 부른다. 모바일 서랍을 닫을 때 쓴다. */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <nav aria-label="주 메뉴" className="flex h-full flex-col gap-1 p-3">
      {MAIN_MENU.map((item) => (
        <MenuLink key={item.path} item={item} onNavigate={onNavigate} />
      ))}
      <div className="mt-auto border-t border-line pt-3">
        <MenuLink item={SETTINGS_MENU} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}
