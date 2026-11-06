import { useQuery } from "@tanstack/react-query";
import { analysisQueryKeys } from "../model/queryKeys";
import { getSourceSummary } from "./analysisApi";

/** 영상 분석 요약(getSourceSummary). 결과 패널을 그릴지(READY) 정하는 첫 요청이다(SPEC-031 R-1). */
export function useSourceSummary(sourceId: string) {
  return useQuery({
    queryKey: analysisQueryKeys.summary(sourceId),
    queryFn: () => getSourceSummary(sourceId),
  });
}
