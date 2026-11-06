import type { EventQuery, MyEventQuery } from "./eventFilters";

export const analysisQueryKeys = {
  all: ["analysis"] as const,
  source: (sourceId: string) => [...analysisQueryKeys.all, "source", sourceId] as const,
  summary: (sourceId: string) => [...analysisQueryKeys.source(sourceId), "summary"] as const,
  sourceEvents: (sourceId: string, query: EventQuery) =>
    [...analysisQueryKeys.source(sourceId), "events", query] as const,
  risks: (sourceId: string) => [...analysisQueryKeys.source(sourceId), "risks"] as const,
  snapshots: (sourceId: string) => [...analysisQueryKeys.source(sourceId), "snapshots"] as const,
  event: (eventId: string) => [...analysisQueryKeys.all, "event", eventId] as const,
  myEvents: (query: MyEventQuery, page: number) =>
    [...analysisQueryKeys.all, "my-events", query, page] as const,
};
