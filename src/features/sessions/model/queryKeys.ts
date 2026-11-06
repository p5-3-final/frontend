export const sessionQueryKeys = {
  all: ["work-sessions"] as const,
  lists: () => [...sessionQueryKeys.all, "list"] as const,
  list: (page: number, size: number) => [...sessionQueryKeys.lists(), page, size] as const,
  detail: (sessionId: string) => [...sessionQueryKeys.all, "detail", sessionId] as const,
  // 영상별 분석 조회. 영상 상세(analysis)의 query와 키를 나눠, 세션 화면의 동시 제한 대기열(NFR-1)로만 묻는다.
  videoAnalysis: (videoId: string) => [...sessionQueryKeys.all, "video-analysis", videoId] as const,
  summary: (videoId: string) => [...sessionQueryKeys.videoAnalysis(videoId), "summary"] as const,
  flowEvents: (videoId: string) => [...sessionQueryKeys.videoAnalysis(videoId), "events"] as const,
  risks: (videoId: string) => [...sessionQueryKeys.videoAnalysis(videoId), "risks"] as const,
};
