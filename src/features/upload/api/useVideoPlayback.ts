import { useQuery } from "@tanstack/react-query";
import { videoQueryKeys } from "../model/queryKeys";
import { getVideoPlayback } from "./mediaApi";

/**
 * 원본 재생·내려받기 주소(operationId getVideoPlayback).
 *
 * 주소는 1시간 동안만 유효해서 자동으로 다시 받지 않고, 만료되면 플레이어가 직접 다시 받는다(SPEC-006 R-11).
 * 화면을 떠나면 캐시에서 바로 버려 서명 주소가 메모리에 남지 않게 한다(NFR-3).
 */
export function useVideoPlayback(videoId: string) {
  return useQuery({
    queryKey: videoQueryKeys.playback(videoId),
    queryFn: () => getVideoPlayback(videoId),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
}
