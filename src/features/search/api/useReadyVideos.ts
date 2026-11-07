import { useVideos } from "../../upload";

/**
 * "이 영상" 범위에서 고를 수 있는 내 영상. 검색 색인은 분석이 끝난 영상에만 있어 READY만 보인다.
 * 목록 첫 쪽(20개)만 읽는다. 영상 상세에서 온 경우 그 영상은 URL의 sourceId로 이미 골라져 있다.
 */
export function useReadyVideos() {
  const query = useVideos(0);
  return {
    ...query,
    videos: (query.data?.items ?? []).filter((video) => video.status === "READY"),
  };
}
