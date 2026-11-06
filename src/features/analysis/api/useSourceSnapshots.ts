import { useQuery } from "@tanstack/react-query";
import { analysisQueryKeys } from "../model/queryKeys";
import { listSourceSnapshots } from "./analysisApi";

/** 영상의 상태 스냅샷(listSourceSnapshots) */
export function useSourceSnapshots(sourceId: string) {
  return useQuery({
    queryKey: analysisQueryKeys.snapshots(sourceId),
    queryFn: () => listSourceSnapshots(sourceId),
  });
}
