import { useQuery } from "@tanstack/react-query";
import { analysisQueryKeys } from "../model/queryKeys";
import type { Track } from "../model/inspectSchemas";
import { getTrack } from "./inspectApi";

/**
 * 트랙과 속성(getTrack). 클릭 조회 결과를 처음 값으로 쓰고, 알림이 와서 무효화될 때만 다시 묻는다(R-5).
 */
export function useTrack(trackId: string, initial: Track) {
  return useQuery({
    queryKey: analysisQueryKeys.track(trackId),
    queryFn: () => getTrack(trackId),
    initialData: initial,
    staleTime: Infinity,
  });
}
