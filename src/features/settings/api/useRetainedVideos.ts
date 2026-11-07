import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { settingsQueryKeys } from "../model/queryKeys";
import { listRetainedVideos } from "./settingsApi";

/** 보존 중인 삭제 영상 한 쪽(SPEC-034 R-10) */
export function useRetainedVideos(page: number) {
  return useQuery({
    queryKey: settingsQueryKeys.retained(page),
    queryFn: () => listRetainedVideos(page),
    placeholderData: keepPreviousData,
  });
}
