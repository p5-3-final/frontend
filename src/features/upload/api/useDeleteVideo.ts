import { useMutation, useQueryClient } from "@tanstack/react-query";
import { videoQueryKeys } from "../model/queryKeys";
import { deleteVideo } from "./mediaApi";

/**
 * 영상 삭제(operationId deleteVideo). 성공하든 실패하든 목록을 다시 불러온다(SPEC-005 R-19, R-20).
 * 지운 영상의 상세·재생 주소 캐시는 화면에서 쓰고 있지 않을 때만 버린다. 상세 화면에서 쓰는 중에 버리면 그 화면이 다시
 * 불러와 "찾을 수 없음"이 잠깐 보이므로, 상세 화면은 화면이 사라질 때 직접 버린다(SPEC-006 R-13).
 */
export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => deleteVideo(videoId),
    onSuccess: (_, videoId) => {
      queryClient.removeQueries({ queryKey: videoQueryKeys.detail(videoId), type: "inactive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: videoQueryKeys.lists() }),
  });
}
