import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { videoQueryKeys } from "../model/queryKeys";
import { listVideos } from "./mediaApi";

/** 내 영상 목록 한 쪽(operationId listVideos). 쪽을 넘기는 동안 이전 쪽을 그대로 보여 준다. */
export function useVideos(page: number) {
  return useQuery({
    queryKey: videoQueryKeys.list(page),
    queryFn: () => listVideos(page),
    placeholderData: keepPreviousData,
  });
}
