import type { ReviewQuery } from "./reviewQuery";
import type { TrendQuery, AlertQuery } from "./trendQuery";

export const qualityQueryKeys = {
  all: ["quality"] as const,
  reviewItems: () => [...qualityQueryKeys.all, "review-items"] as const,
  reviewList: (query: ReviewQuery, page: number) =>
    [...qualityQueryKeys.reviewItems(), "list", query, page] as const,
  reviewItem: (itemId: string) => [...qualityQueryKeys.reviewItems(), "item", itemId] as const,
  goldenSets: () => [...qualityQueryKeys.all, "golden-sets"] as const,
  goldenSetList: () => [...qualityQueryKeys.goldenSets(), "list"] as const,
  goldenSet: (setId: string) => [...qualityQueryKeys.goldenSets(), "set", setId] as const,
  goldenEntries: (setId: string) => [...qualityQueryKeys.goldenSet(setId), "entries"] as const,
  goldenVersions: (setId: string) => [...qualityQueryKeys.goldenSet(setId), "versions"] as const,
  runs: () => [...qualityQueryKeys.all, "runs"] as const,
  runList: (goldenSetId: string | undefined, page: number) =>
    [...qualityQueryKeys.runs(), "list", goldenSetId ?? null, page] as const,
  run: (runId: string) => [...qualityQueryKeys.runs(), "run", runId] as const,
  sourceStages: (sourceId: string) => [...qualityQueryKeys.all, "stages", sourceId] as const,
  stageTrend: (query: TrendQuery) => [...qualityQueryKeys.all, "trend", query] as const,
  alertReport: (query: AlertQuery) => [...qualityQueryKeys.all, "alerts", query] as const,
  imports: () => [...qualityQueryKeys.all, "imports"] as const,
  importList: (page: number) => [...qualityQueryKeys.imports(), "list", page] as const,
  importItem: (importId: string) => [...qualityQueryKeys.imports(), "item", importId] as const,
  featureExport: (exportId: string) => [...qualityQueryKeys.all, "exports", exportId] as const,
};
