export const videoQueryKeys = {
  all: ["videos"] as const,
  lists: () => [...videoQueryKeys.all, "list"] as const,
  list: (page: number) => [...videoQueryKeys.lists(), page] as const,
  detail: (videoId: string) => [...videoQueryKeys.all, "detail", videoId] as const,
  playback: (videoId: string) => [...videoQueryKeys.detail(videoId), "playback"] as const,
};
