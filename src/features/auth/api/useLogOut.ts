import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequestNoContent } from "../../../shared/api/client";
import { endSession } from "../../../shared/api/session";

/**
 * 로그아웃 요청(계약 operationId logOut). 서버 요청이 실패해도 이 브라우저의 로그인 상태는 지운다(SPEC-002 R-12).
 * 세션이 끝나면 RequireAuth가 로그인 화면으로 보낸다.
 */
export function useLogOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequestNoContent("/api/v1/auth/logout", { method: "POST" }),
    onSettled: () => {
      endSession();
      queryClient.clear();
    },
  });
}
