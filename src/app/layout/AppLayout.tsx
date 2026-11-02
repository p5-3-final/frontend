import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

/** 로그인 후 모든 화면의 틀: 상단 바, 왼쪽 메뉴, 본문(SPEC-002 R-13). */
export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <TopBar />
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-line bg-panel lg:block">
          <Sidebar />
        </aside>
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
