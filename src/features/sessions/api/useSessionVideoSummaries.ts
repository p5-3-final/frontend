import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";
import { limitConcurrency, type ConcurrencyLimiter } from "../../../shared/lib/limitConcurrency";
import {
  getSourceSummary,
  listSourceEvents,
  listSourceRisks,
  type EventSummary,
  type SourceSummary,
} from "../../analysis";
import type { Video } from "../../upload";
import { sessionQueryKeys } from "../model/queryKeys";
import type { FlowSource } from "../model/sessionFlow";

export type SummaryQuery = UseQueryResult<SourceSummary>;

/** SPEC-034 NFR-1: 세션 화면 하나가 analysis에 동시에 보내는 요청 수 */
export const SESSION_ANALYSIS_CONCURRENCY = 4;

export interface SessionVideoAnalysis {
  /** 영상 ID별 요약 query */
  summaries: ReadonlyMap<string, SummaryQuery>;
  /** 흐름 요약의 재료. 영상 순서는 세션 상세가 준 순서와 같다(R-4). */
  flowSources: FlowSource[];
  /** 분석된 영상의 이벤트·위험 조회 중 실패한 것이 있으면 참 */
  flowError: boolean;
  flowPending: boolean;
  /** 정규화가 끝나지 않았거나(media READY 아님) 분석 결과가 없는 영상이 있으면 참(R-5) */
  incomplete: boolean;
}

/**
 * 세션 영상마다 분석 요약(R-3)과 흐름 요약용 확정 이벤트·위험(R-4)을 묻는다.
 * 모든 요청은 화면마다 하나인 대기열을 거쳐 동시에 4개까지만 나간다(NFR-1). 이벤트·위험은 분석된 영상만 묻는다.
 */
export function useSessionVideoAnalysis(videos: readonly Video[]): SessionVideoAnalysis {
  const [limit] = useState(() => limitConcurrency(SESSION_ANALYSIS_CONCURRENCY));
  const summaries = useQueries({
    queries: videos.map((video) => ({
      queryKey: sessionQueryKeys.summary(video.id),
      queryFn: () => limit(() => getSourceSummary(video.id)),
    })),
  });
  const analysed = (index: number) => summaries[index]?.data?.status === "READY";
  const events = useQueries({
    queries: videos.map((video, index) => ({
      queryKey: sessionQueryKeys.flowEvents(video.id),
      queryFn: () => listAllConfirmedEvents(video.id, limit),
      enabled: analysed(index),
    })),
  });
  const risks = useQueries({
    queries: videos.map((video, index) => ({
      queryKey: sessionQueryKeys.risks(video.id),
      queryFn: () => limit(() => listSourceRisks(video.id)).then((list) => list.items),
      enabled: analysed(index),
    })),
  });
  const flowQueries = [...events, ...risks].filter((_, index) => analysed(index % videos.length));
  return {
    summaries: new Map(
      videos.flatMap((video, index) => {
        const summary = summaries[index];
        return summary === undefined ? [] : [[video.id, summary] as const];
      }),
    ),
    flowSources: videos.map((video, index) => ({
      video,
      events: events[index]?.data,
      risks: risks[index]?.data,
    })),
    flowError: flowQueries.some((query) => query.isError),
    flowPending:
      summaries.some((query) => query.isPending) || flowQueries.some((query) => query.isPending),
    incomplete: videos.some(
      (video, index) =>
        video.status !== "READY" || summaries[index]?.data?.status === "NOT_ANALYZED",
    ),
  };
}

// 이벤트가 100개를 넘는 영상은 다음 쪽도 같은 대기열로 받는다(plan 4절).
async function listAllConfirmedEvents(
  videoId: string,
  limit: ConcurrencyLimiter,
): Promise<EventSummary[]> {
  const query = { verificationStatus: "confirmed" } as const;
  const first = await limit(() => listSourceEvents(videoId, query, 0));
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.page.totalPages - 1) }, (_, index) =>
      limit(() => listSourceEvents(videoId, query, index + 1)),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
}
