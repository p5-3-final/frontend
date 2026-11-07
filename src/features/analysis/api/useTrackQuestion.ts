import { useQuery } from "@tanstack/react-query";
import { analysisQueryKeys } from "../model/queryKeys";
import { getTrackQuestion } from "./inspectApi";

/** 객체 질문 결과(getTrackQuestion, R-8). 답이 준비됐다는 알림을 받은 뒤에만 묻는다. */
export function useTrackQuestion(trackId: string, requestId: string, enabled: boolean) {
  return useQuery({
    queryKey: analysisQueryKeys.question(trackId, requestId),
    queryFn: () => getTrackQuestion(trackId, requestId),
    enabled,
    staleTime: Infinity,
  });
}
