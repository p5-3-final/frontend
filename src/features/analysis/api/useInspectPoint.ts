import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analysisQueryKeys } from "../model/queryKeys";
import { inspectPoint } from "./inspectApi";

/**
 * 화면 클릭 조회(SPEC-032 R-3). 찾은 트랙은 트랙 캐시에 넣어 패널이 다시 묻지 않고 바로 그린다.
 * 그 뒤 속성은 track.analyzed 알림이 오면 다시 읽는다(R-5).
 */
export function useInspectPoint(sourceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (point: { tMs: number; x: number; y: number }) => inspectPoint(sourceId, point),
    onSuccess: (result) => {
      if (result.track !== null) {
        queryClient.setQueryData(analysisQueryKeys.track(result.track.trackId), result.track);
      }
    },
  });
}
