import { ChevronDown, CircleUserRound, LogOut } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { useLogOut } from "../api/useLogOut";
import { useMe } from "../api/useMe";
import { roleLabel } from "../model/roles";

/** 상단 바의 사용자 메뉴. 닉네임, 이메일, 역할과 로그아웃을 보여 준다(SPEC-002 R-4, R-11, R-12). */
export function UserMenu() {
  const me = useMe();
  const logOut = useLogOut();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 열려 있는 동안 Escape와 바깥 클릭으로 닫는다(NFR-2). 문서 이벤트는 React 밖이라 효과로 구독한다.
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const user = me.data;
  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-content hover:bg-panel-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <CircleUserRound aria-hidden="true" className="size-5 text-muted" />
        {user?.nickname ?? "내 계정"}
        <ChevronDown aria-hidden="true" className="size-4 text-muted" />
      </button>
      {open && (
        <section
          id={panelId}
          aria-label="내 계정"
          className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-panel-raised p-4 shadow-2xl"
        >
          {user === undefined ? (
            <p className="text-sm text-muted">
              {me.isError ? "내 정보를 불러오지 못했습니다." : "불러오는 중입니다."}
            </p>
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">닉네임</dt>
              <dd className="font-semibold">{user.nickname}</dd>
              <dt className="text-muted">이메일</dt>
              <dd className="break-all">{user.email}</dd>
              <dt className="text-muted">역할</dt>
              <dd>{roleLabel(user.roles)}</dd>
            </dl>
          )}
          <Button
            variant="secondary"
            className="mt-4 w-full"
            disabled={logOut.isPending}
            onClick={() => {
              logOut.mutate();
            }}
          >
            <LogOut aria-hidden="true" className="size-4" />
            로그아웃
          </Button>
        </section>
      )}
    </div>
  );
}
