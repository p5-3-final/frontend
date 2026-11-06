import { useQuery } from "@tanstack/react-query";
import { getSessionPlayback } from "../api/streamApi";
import { streamQueryKeys } from "../model/queryKeys";

/** 라이브 HLS 서명 주소. 화면을 떠나면 캐시에서 바로 버린다(NFR-3). 만료되면 플레이어가 다시 받는다. */
export function useSessionPlayback(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: streamQueryKeys.playback(sessionId),
    queryFn: () => getSessionPlayback(sessionId),
    enabled,
    staleTime: Infinity,
    gcTime: 0,
  });
}
