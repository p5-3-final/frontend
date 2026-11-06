import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { sessionQueryKeys } from "../model/queryKeys";
import { listWorkSessions, SESSION_PAGE_SIZE } from "./sessionsApi";

/** 내 작업 세션 한 쪽(SPEC-034 R-1). 쪽을 옮기는 동안 이전 쪽을 보여 준다. */
export function useWorkSessions(page: number, size = SESSION_PAGE_SIZE) {
  return useQuery({
    queryKey: sessionQueryKeys.list(page, size),
    queryFn: () => listWorkSessions(page, size),
    placeholderData: keepPreviousData,
  });
}
