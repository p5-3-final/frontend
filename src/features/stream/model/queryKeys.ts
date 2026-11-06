export const streamQueryKeys = {
  all: ["stream"] as const,
  session: (sessionId: string) => [...streamQueryKeys.all, "session", sessionId] as const,
  playback: (sessionId: string) => [...streamQueryKeys.session(sessionId), "playback"] as const,
  live: (sessionId: string) => [...streamQueryKeys.session(sessionId), "live"] as const,
  state: (sessionId: string) => [...streamQueryKeys.live(sessionId), "state"] as const,
  events: (sessionId: string) => [...streamQueryKeys.live(sessionId), "events"] as const,
  alerts: (sessionId: string) => [...streamQueryKeys.live(sessionId), "alerts"] as const,
};
