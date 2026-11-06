import { useQuery } from "@tanstack/react-query";
import { analysisQueryKeys } from "../model/queryKeys";
import { listSourceRisks } from "./analysisApi";

/** 영상의 위험 상태(listSourceRisks). 응답이 이미 활성 먼저·firstSeenMs 순이다(SPEC-031 R-8). */
export function useSourceRisks(sourceId: string) {
  return useQuery({
    queryKey: analysisQueryKeys.risks(sourceId),
    queryFn: () => listSourceRisks(sourceId),
  });
}
