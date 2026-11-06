import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionQueryKeys } from "../model/queryKeys";
import type { CreateWorkSessionRequest } from "../model/schemas";
import { createWorkSession } from "./sessionsApi";

/** 작업 세션 만들기(SPEC-034 R-2, R-7). 성공하면 세션 목록을 다시 읽게 한다. */
export function useCreateWorkSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateWorkSessionRequest) => createWorkSession(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionQueryKeys.lists() }),
  });
}
