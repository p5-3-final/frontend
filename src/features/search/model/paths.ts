/** 영상 하나를 범위로 고른 검색 화면 주소. 영상 상세의 "이 영상에서 검색"이 쓴다. */
export function sourceSearchPath(sourceId: string): string {
  return `/search?${new URLSearchParams({ scope: "source", sourceId }).toString()}`;
}
