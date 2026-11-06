import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analysisQueryKeys } from "../model/queryKeys";
import type { ReviewEventRequest } from "../model/schemas";
import { reviewEvent } from "./analysisApi";

/**
 * 이벤트 확인·기각(reviewEvent, OPERATOR). 응답으로 상세 캐시를 바꾸고, 목록(영상·전체)은 다시 불러온다(SPEC-031 R-7).
 */
export function useReviewEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ReviewEventRequest) => reviewEvent(eventId, request),
    onSuccess: (detail) => {
      queryClient.setQueryData(analysisQueryKeys.event(eventId), detail);
      void queryClient.invalidateQueries({
        queryKey: [...analysisQueryKeys.source(detail.event.sourceId), "events"],
      });
      void queryClient.invalidateQueries({ queryKey: [...analysisQueryKeys.all, "my-events"] });
    },
  });
}
