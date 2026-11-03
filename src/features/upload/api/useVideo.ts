import { useQuery } from "@tanstack/react-query";
import { videoQueryKeys } from "../model/queryKeys";
import { getVideo } from "./mediaApi";

/** 영상 상세(operationId getVideo). */
export function useVideo(videoId: string) {
  return useQuery({
    queryKey: videoQueryKeys.detail(videoId),
    queryFn: () => getVideo(videoId),
  });
}
