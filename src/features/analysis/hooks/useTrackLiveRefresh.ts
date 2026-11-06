import { useQueryClient } from "@tanstack/react-query";
import { useNotification } from "../../notifications";
import { analysisQueryKeys } from "../model/queryKeys";

/**
 * 열린 트랙 패널의 속성을 알림으로 갱신한다(SPEC-032 R-5). 속성 분석은 클릭(click)이나 이벤트 판정(event)으로 시작된다.
 * 알림이 클릭 조회 응답보다 먼저 올 수 있어, 구독을 시작할 때 받아 둔 알림도 함께 본다.
 */
export function useTrackLiveRefresh(sourceId: string, trackId: string): void {
  const queryClient = useQueryClient();
  useNotification(
    "track.analyzed",
    (message) => {
      if (message.data.trackId !== trackId || message.data.reason === "question") {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: analysisQueryKeys.track(trackId) });
    },
    { sourceId, replayBuffered: true },
  );
}
