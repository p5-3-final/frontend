import { Navigate, Outlet, useLocation } from "react-router";
import { Spinner } from "../../../shared/ui/Spinner";
import { useSessionStatus } from "../hooks/useSessionStatus";
import { logInPathFor } from "../model/redirect";

/** 로그인해야 쓸 수 있는 화면을 감싼다. 로그아웃 상태면 지금 주소를 기억한 채 로그인 화면으로 보낸다(SPEC-002 R-7). */
export function RequireAuth() {
  const status = useSessionStatus();
  const { pathname, search } = useLocation();
  if (status === "checking") {
    return <Spinner label="로그인 상태를 확인하고 있습니다" />;
  }
  if (status === "anonymous") {
    return <Navigate to={logInPathFor(pathname, search)} replace />;
  }
  return <Outlet />;
}
