import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "../../notifications";
import { searchQueryKeys } from "../model/queryKeys";
import type { GroundingStatus } from "../model/schemas";

// 검색 결과 캐시와 같이 오래 둔다. 영상 상세에 갔다 돌아와도 받은 주석 상태가 남는다(SPEC-033 R-12).
const LIVE_STATUS_GC_MS = 30 * 60 * 1000;

/**
 * 주석 하나의 현재 상태(SPEC-033 R-5). 처음은 검색 응답의 값이고, `grounding.completed` 알림이 오면 그 결과로 바뀐다.
 * 받은 상태는 검색 결과 캐시를 고치지 않고 주석별 query에 둔다. 검색 응답보다 알림이 먼저 올 수 있어 받아 둔 알림도 다시 읽는다.
 */
export function useGroundingLiveStatus(
  groundingId: string,
  initial: GroundingStatus,
): GroundingStatus {
  const queryClient = useQueryClient();
  const queryKey = searchQueryKeys.grounding(groundingId);
  const waiting = initial === "REQUESTED";
  useNotification(
    "grounding.completed",
    (message) => {
      if (waiting && message.data.groundingId === groundingId) {
        queryClient.setQueryData(queryKey, message.data.outcome);
      }
    },
    { replayBuffered: true },
  );
  const live = useQuery<GroundingStatus>({
    queryKey,
    queryFn: skipToken,
    gcTime: LIVE_STATUS_GC_MS,
  });
  return live.data ?? initial;
}
