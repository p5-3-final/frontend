import { CircleUserRound } from "lucide-react";
import { useMe } from "../api/useMe";

/** 상단 바의 사용자 메뉴. 로그인한 사용자의 닉네임을 보여 준다(SPEC-002 R-4). */
export function UserMenu() {
  const me = useMe();
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-content hover:bg-panel-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <CircleUserRound aria-hidden="true" className="size-5 text-muted" />
      {me.data?.nickname ?? "내 계정"}
    </button>
  );
}
