import { useQuery } from "@tanstack/react-query";
import { analysisQueryKeys } from "../model/queryKeys";
import { getSourceZones } from "./inspectApi";

/** 영상의 위험구역 정의(getSourceZones). 편집기(R-10)와 요약 패널의 재분석 안내(R-13)가 함께 쓴다. */
export function useSourceZones(sourceId: string, enabled = true) {
  return useQuery({
    queryKey: analysisQueryKeys.zones(sourceId),
    queryFn: () => getSourceZones(sourceId),
    enabled,
  });
}
