import { Menu } from "lucide-react";
import type { Ref } from "react";
import { UserMenu } from "../../features/auth";
import { Brand } from "../../shared/ui/Brand";

export interface TopBarProps {
  navId: string;
  navOpen: boolean;
  onOpenNav: () => void;
  menuButtonRef: Ref<HTMLButtonElement>;
}

export function TopBar({ navId, navOpen, onOpenNav, menuButtonRef }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line bg-panel px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-1">
        {/* SPEC-002 NFR-5: 1024px 미만에서는 사이드바 대신 이 버튼으로 메뉴를 연다. */}
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={navOpen}
          aria-controls={navId}
          onClick={onOpenNav}
          className="inline-flex size-10 items-center justify-center rounded-lg text-content hover:bg-panel-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none lg:hidden"
        >
          <Menu aria-hidden="true" className="size-6" />
        </button>
        <Brand />
      </div>
      <UserMenu />
    </header>
  );
}
