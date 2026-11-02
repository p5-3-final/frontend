import { Bell, History, MonitorPlay, Search, Settings, type LucideIcon } from "lucide-react";

export interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

// SPEC-002 R-14: 사이드바 메뉴. 설정은 사이드바 아래쪽에 따로 둔다.
export const MAIN_MENU: readonly MenuItem[] = [
  { path: "/analysis", label: "영상 분석", icon: MonitorPlay },
  { path: "/events", label: "이벤트", icon: Bell },
  { path: "/search", label: "검색", icon: Search },
  { path: "/history", label: "분석 이력", icon: History },
];

export const SETTINGS_MENU: MenuItem = { path: "/settings", label: "설정", icon: Settings };
