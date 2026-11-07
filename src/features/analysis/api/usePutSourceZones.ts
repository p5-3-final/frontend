import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ZoneDefinition } from "../model/inspectSchemas";
import { analysisQueryKeys } from "../model/queryKeys";
import { putSourceZones } from "./inspectApi";

/** 구역 목록 전체 저장(putSourceZones, R-12). 응답으로 구역 캐시를 바꿔 요약 패널 안내(R-13)도 바로 바뀐다. */
export function usePutSourceZones(sourceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: readonly ZoneDefinition[]) => putSourceZones(sourceId, items),
    onSuccess: (zones) => {
      queryClient.setQueryData(analysisQueryKeys.zones(sourceId), zones);
    },
  });
}
