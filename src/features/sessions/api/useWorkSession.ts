import { useQuery } from "@tanstack/react-query";
import { sessionQueryKeys } from "../model/queryKeys";
import { getWorkSession } from "./sessionsApi";

/** 작업 세션 상세와 속한 영상(SPEC-034 R-3) */
export function useWorkSession(sessionId: string) {
  return useQuery({
    queryKey: sessionQueryKeys.detail(sessionId),
    queryFn: () => getWorkSession(sessionId),
  });
}
