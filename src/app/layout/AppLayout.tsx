import { useCallback, useId, useRef, useState } from "react";
import { Outlet } from "react-router";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

/** 로그인 후 모든 화면의 틀: 상단 바, 왼쪽 메뉴, 본문(SPEC-002 R-13). */
export function AppLayout() {
  const navId = useId();
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  // MobileNav의 효과가 이 함수에 의존하므로 렌더링마다 바뀌지 않게 둔다.
  const closeNav = useCallback(() => {
    setNavOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <TopBar
        navId={navId}
        navOpen={navOpen}
        menuButtonRef={menuButtonRef}
        onOpenNav={() => {
          setNavOpen(true);
        }}
      />
      {navOpen && <MobileNav id={navId} onClose={closeNav} />}
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
