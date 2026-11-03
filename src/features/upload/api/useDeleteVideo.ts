import { useMutation, useQueryClient } from "@tanstack/react-query";
import { videoQueryKeys } from "../model/queryKeys";
import { deleteVideo } from "./mediaApi";

/** 영상 삭제(operationId deleteVideo). 성공하든 실패하든 목록을 다시 불러온다(SPEC-005 R-19, R-20). */
export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => deleteVideo(videoId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: videoQueryKeys.all }),
  });
}
