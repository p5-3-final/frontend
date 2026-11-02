import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../shared/api/client";
import { useSessionStatus } from "../hooks/useSessionStatus";
import { authQueryKeys } from "../model/queryKeys";
import { userSchema } from "../model/schemas";

/** 내 정보(계약 operationId getMe). 로그인 상태일 때만 요청한다. */
export function useMe() {
  const status = useSessionStatus();
  return useQuery({
    queryKey: authQueryKeys.me(),
    queryFn: () => apiRequest("/api/v1/auth/me", userSchema),
    enabled: status === "authenticated",
  });
}
