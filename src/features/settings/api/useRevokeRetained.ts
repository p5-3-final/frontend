import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsQueryKeys } from "../model/queryKeys";
import { revokeAllRetainedVideos, revokeRetainedVideo } from "./settingsApi";

/**
 * 학습용 보존 철회(SPEC-034 R-10). `videoId`가 없으면 전체 철회다.
 * 성공하든 실패하든 목록을 다시 읽는다. 404(이미 만료·철회)면 그 영상은 목록에서도 빠져 있어야 하기 때문이다.
 */
export function useRevokeRetained() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string | undefined) =>
      videoId === undefined ? revokeAllRetainedVideos() : revokeRetainedVideo(videoId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: settingsQueryKeys.retainedLists() }),
  });
}
