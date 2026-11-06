import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useMe } from "../../auth";
import { Alert } from "../../../shared/ui/Alert";
import { QUALITY_FORBIDDEN_MESSAGE } from "../../../shared/lib/messages";

export interface RequireOperatorProps {
  children: ReactNode;
}

/**
 * OPERATOR만 품질 화면을 본다(SPEC-035 R-1). 메뉴를 숨겨도 주소로 직접 들어올 수 있어 화면에서도 막는다.
 * 권한은 quality-service가 다시 검사한다(R-20).
 */
export function RequireOperator({ children }: RequireOperatorProps) {
  const { data: me, isPending } = useMe();
  if (isPending) {
    return (
      <p role="status" className="flex items-center gap-2 text-muted">
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />내 정보를 확인하는
        중입니다.
      </p>
    );
  }
  if (me?.roles.includes("OPERATOR") !== true) {
    return <Alert>{QUALITY_FORBIDDEN_MESSAGE}</Alert>;
  }
  return children;
}
