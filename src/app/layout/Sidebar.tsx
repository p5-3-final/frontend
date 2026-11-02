import { NavLink } from "react-router";
import { MAIN_MENU, SETTINGS_MENU, type MenuItem } from "./menu";

function MenuLink({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
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
export function Sidebar() {
  return (
    <nav aria-label="주 메뉴" className="flex h-full flex-col gap-1 p-3">
      {MAIN_MENU.map((item) => (
        <MenuLink key={item.path} item={item} />
      ))}
      <div className="mt-auto border-t border-line pt-3">
        <MenuLink item={SETTINGS_MENU} />
      </div>
    </nav>
  );
}
