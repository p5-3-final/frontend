import { skipToken, useQuery } from "@tanstack/react-query";
import { qualityQueryKeys } from "../model/queryKeys";
import type { AlertQuery, TrendQuery } from "../model/trendQuery";
import { getAlertReport, getSourceStageReport, getStageTrend } from "./qualityApi";

/** 영상별 단계 분해(getSourceStageReport, SPEC-035 R-14). 영상 ID를 넣기 전에는 요청하지 않는다. */
export function useSourceStageReport(sourceId: string | undefined) {
  return useQuery({
    queryKey: qualityQueryKeys.sourceStages(sourceId ?? ""),
    queryFn: sourceId === undefined ? skipToken : () => getSourceStageReport(sourceId),
    retry: false,
  });
}

/** 단계 추이(getStageTrend, R-15). 조회 조건이 정해진 뒤에만 요청한다. */
export function useStageTrend(query: TrendQuery | undefined) {
  return useQuery({
    queryKey: qualityQueryKeys.stageTrend(query ?? null),
    queryFn: query === undefined ? skipToken : () => getStageTrend(query),
  });
}

/** 긴급 알림 지표(getAlertReport, R-22). 조회 조건이 정해진 뒤에만 요청한다. */
export function useAlertReport(query: AlertQuery | undefined) {
  return useQuery({
    queryKey: qualityQueryKeys.alertReport(query ?? null),
    queryFn: query === undefined ? skipToken : () => getAlertReport(query),
  });
}
