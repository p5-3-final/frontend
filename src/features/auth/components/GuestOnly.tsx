import { Navigate, Outlet, useSearchParams } from "react-router";
import { Spinner } from "../../../shared/ui/Spinner";
import { useSessionStatus } from "../hooks/useSessionStatus";
import { safeRedirect } from "../model/redirect";

/**
 * 로그인·가입 화면을 감싼다. 이미 로그인 상태면 앱으로 보낸다.
 *
 * 로그인에 성공한 순간에도 여기서 이동하므로, 로그인 화면과 같은 redirect 규칙으로 목적지를 정한다(SPEC-002 R-7).
 */
export function GuestOnly() {
  const status = useSessionStatus();
  const [searchParams] = useSearchParams();
  if (status === "checking") {
    return <Spinner label="로그인 상태를 확인하고 있습니다" />;
  }
  if (status === "authenticated") {
    return <Navigate to={safeRedirect(searchParams.get("redirect"))} replace />;
  }
  return <Outlet />;
}
