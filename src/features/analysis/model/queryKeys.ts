import type { EventQuery, MyEventQuery } from "./eventFilters";

export const analysisQueryKeys = {
  all: ["analysis"] as const,
  source: (sourceId: string) => [...analysisQueryKeys.all, "source", sourceId] as const,
  summary: (sourceId: string) => [...analysisQueryKeys.source(sourceId), "summary"] as const,
  sourceEvents: (sourceId: string, query: EventQuery) =>
    [...analysisQueryKeys.source(sourceId), "events", query] as const,
  risks: (sourceId: string) => [...analysisQueryKeys.source(sourceId), "risks"] as const,
  snapshots: (sourceId: string) => [...analysisQueryKeys.source(sourceId), "snapshots"] as const,
  // SPEC-032: 오버레이 구간은 시작 시각(10초 단위)으로 나눈다.
  overlay: (sourceId: string, windowStartMs: number) =>
    [...analysisQueryKeys.source(sourceId), "overlay", windowStartMs] as const,
  zones: (sourceId: string) => [...analysisQueryKeys.source(sourceId), "zones"] as const,
  track: (trackId: string) => [...analysisQueryKeys.all, "track", trackId] as const,
  question: (trackId: string, requestId: string) =>
    [...analysisQueryKeys.track(trackId), "question", requestId] as const,
  event: (eventId: string) => [...analysisQueryKeys.all, "event", eventId] as const,
  myEvents: (query: MyEventQuery, page: number) =>
    [...analysisQueryKeys.all, "my-events", query, page] as const,
};
