import {
  Bell,
  History,
  MonitorPlay,
  Search,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "../../features/auth";

export interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** 이 역할이 있는 사용자에게만 보인다(SPEC-035 R-1). 권한은 서버가 다시 검사한다. */
  requiredRole?: Role;
}

// SPEC-002 R-14: 사이드바 메뉴. 설정은 사이드바 아래쪽에 따로 둔다.
export const MAIN_MENU: readonly MenuItem[] = [
  { path: "/analysis", label: "영상 분석", icon: MonitorPlay },
  { path: "/events", label: "이벤트", icon: Bell },
  { path: "/search", label: "검색", icon: Search },
  { path: "/history", label: "분석 이력", icon: History },
  { path: "/quality", label: "품질", icon: ShieldCheck, requiredRole: "OPERATOR" },
];

export const SETTINGS_MENU: MenuItem = { path: "/settings", label: "설정", icon: Settings };
