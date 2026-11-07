import { useQueries } from "@tanstack/react-query";
import { mergeOverlayTracks, OVERLAY_WINDOW_MS, overlayWindowStart } from "../../player";
import { analysisQueryKeys } from "../model/queryKeys";
import { getSourceOverlay } from "./inspectApi";

/**
 * 재생 시각이 든 10초 구간과 다음 구간의 트랙 박스(getSourceOverlay, R-1). 다음 구간을 미리 받아 넘어갈 때 비지 않게 한다.
 * 같은 구간은 다시 묻지 않고(staleTime 무한), 화면에서 쓰지 않게 된 구간은 바로 버린다.
 */
export function useSourceOverlay(sourceId: string, currentMs: number, enabled: boolean) {
  const start = overlayWindowStart(currentMs);
  const results = useQueries({
    queries: [start, start + OVERLAY_WINDOW_MS].map((fromMs) => ({
      queryKey: analysisQueryKeys.overlay(sourceId, fromMs),
      queryFn: () => getSourceOverlay(sourceId, fromMs, fromMs + OVERLAY_WINDOW_MS),
      enabled,
      staleTime: Infinity,
      gcTime: 0,
    })),
  });
  return {
    tracks: mergeOverlayTracks(results.map((result) => result.data?.tracks ?? [])),
    error: results.find((result) => result.error !== null)?.error ?? null,
  };
}
