export const cameraQueryKeys = {
  all: ["cameras"] as const,
  lists: () => [...cameraQueryKeys.all, "list"] as const,
  list: (page: number) => [...cameraQueryKeys.lists(), page] as const,
  detail: (cameraId: string) => [...cameraQueryKeys.all, "detail", cameraId] as const,
  sessions: (cameraId: string) => [...cameraQueryKeys.detail(cameraId), "sessions"] as const,
};
