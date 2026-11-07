import { queryOptions, useQuery } from "@tanstack/react-query";
import { videoQueryKeys } from "../model/queryKeys";
import { getVideo } from "./mediaApi";

/** 영상 상세 query. 다른 화면(검색 결과의 영상 이름)도 같은 키로 캐시를 함께 쓴다. */
export function videoDetailQuery(videoId: string) {
  return queryOptions({
    queryKey: videoQueryKeys.detail(videoId),
    queryFn: () => getVideo(videoId),
  });
}

/** 영상 상세(operationId getVideo). */
export function useVideo(videoId: string) {
  return useQuery(videoDetailQuery(videoId));
}
