import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { getSessionStatus, refreshSession } from "../../../shared/api/session";
import { useSessionStatus } from "../hooks/useSessionStatus";
import { authQueryKeys } from "../model/queryKeys";

export interface SessionBootstrapProps {
  children: ReactNode;
}

/**
 * 앱이 시작될 때 재발급 쿠키로 로그인 상태를 되살린다(SPEC-002 R-8, ADR-0004).
 *
 * StrictMode에서 효과가 두 번 실행돼도 `refreshSession`이 진행 중인 요청을 같이 쓰므로 재발급은 한 번만 나간다.
 */
export function SessionBootstrap({ children }: SessionBootstrapProps) {
  const queryClient = useQueryClient();
  const status = useSessionStatus();

  useEffect(() => {
    if (getSessionStatus() === "checking") {
      void refreshSession();
    }
  }, []);

  // 로그아웃 상태가 되면 이전 사용자의 정보가 다음 로그인에 섞이지 않게 지운다.
  useEffect(() => {
    if (status === "anonymous") {
      queryClient.removeQueries({ queryKey: authQueryKeys.all });
    }
  }, [status, queryClient]);

  return children;
}
