import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { qualityQueryKeys } from "../model/queryKeys";
import { getEvaluationRun, listEvaluationRuns } from "./qualityApi";

/** 평가 실행 목록(listEvaluationRuns, SPEC-035 R-12). 받은 시각 내림차순은 서버가 정한다. */
export function useEvaluationRuns(goldenSetId: string | undefined, page: number) {
  return useQuery({
    queryKey: qualityQueryKeys.runList(goldenSetId, page),
    queryFn: () => listEvaluationRuns(goldenSetId, page),
    placeholderData: keepPreviousData,
  });
}

/** 평가 실행 상세(getEvaluationRun, R-13) */
export function useEvaluationRun(runId: string) {
  return useQuery({
    queryKey: qualityQueryKeys.run(runId),
    queryFn: () => getEvaluationRun(runId),
  });
}
