import { useQueryClient } from "@tanstack/react-query";
import { useNotification } from "../../notifications";
import { analysisQueryKeys } from "../model/queryKeys";

/**
 * 열린 영상의 분석이 끝나면(source.completed) 요약·이벤트·위험·스냅샷을 다시 불러온다(SPEC-031 R-16).
 * 네 query가 모두 `analysisQueryKeys.source(sourceId)` 아래에 있어 한 번에 무효화한다.
 */
export function useAnalysisLiveRefresh(sourceId: string): void {
  const queryClient = useQueryClient();
  useNotification(
    "source.completed",
    () => {
      void queryClient.invalidateQueries({ queryKey: analysisQueryKeys.source(sourceId) });
    },
    { sourceId },
  );
}
