import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qualityQueryKeys } from "../model/queryKeys";
import type { ReviewQuery } from "../model/reviewQuery";
import { ApiError } from "../../../shared/api/problem";
import type { ReviewItem, ReviewLabel } from "../model/schemas";
import {
  NEXT_CANDIDATE_SIZE,
  assignReviewItem,
  getReviewItem,
  labelReviewItem,
  listReviewItems,
  releaseReviewItem,
} from "./qualityApi";

/** 검토 큐 한 쪽(listReviewItems, SPEC-035 R-2). 쪽을 넘길 때 이전 쪽을 보인 채로 받는다. */
export function useReviewItems(query: ReviewQuery, page: number) {
  return useQuery({
    queryKey: qualityQueryKeys.reviewList(query, page),
    queryFn: () => listReviewItems(query, page),
    placeholderData: keepPreviousData,
  });
}

/**
 * 검토 항목 상세(getReviewItem, R-4). 근거 프레임 서명 주소가 들어 있어 화면을 떠나면 바로 버린다
 * (plan 3절 VII, 서명 주소는 메모리에만).
 */
export function useReviewItem(itemId: string) {
  return useQuery({
    queryKey: qualityQueryKeys.reviewItem(itemId),
    queryFn: () => getReviewItem(itemId),
    gcTime: 0,
  });
}

/** 맡기 응답으로 상세 캐시를 채워, 상세로 옮기자마자 다시 받지 않고 그린다(NFR-1). */
export function primeReviewItem(queryClient: ReturnType<typeof useQueryClient>, item: ReviewItem) {
  queryClient.setQueryData(qualityQueryKeys.reviewItem(item.itemId), item);
}

/** 맡기(assignReviewItem, R-3). 성공·실패 모두 목록은 다시 받는다(다른 운영자가 먼저 맡았을 수 있다). */
export function useAssignReviewItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignReviewItem,
    onSuccess: (item) => {
      primeReviewItem(queryClient, item);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [...qualityQueryKeys.reviewItems(), "list"] }),
  });
}

/** 내려놓기(releaseReviewItem, R-7) */
export function useReleaseReviewItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: releaseReviewItem,
    onSettled: () => queryClient.invalidateQueries({ queryKey: qualityQueryKeys.reviewItems() }),
  });
}

/**
 * "저장 후 다음"(SPEC-035 R-6, NFR-1). 라벨을 저장한 뒤 같은 거르기의 대기 항목 몇 개를 받아 앞에서부터 맡는다.
 * 다른 운영자가 먼저 맡은 후보(409)는 건너뛴다. 맡은 항목을 돌려주고, 맡을 항목이 없으면 null이다.
 * 맡기 응답으로 상세 캐시를 채워 이동하자마자 그린다.
 */
export function useLabelAndNext(query: ReviewQuery) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, label }: { itemId: string; label: ReviewLabel }) => {
      const saved = await labelReviewItem(itemId, label);
      queryClient.setQueryData(qualityQueryKeys.reviewItem(itemId), saved);
      const candidates = await listReviewItems(
        { ...query, status: "UNASSIGNED" },
        0,
        NEXT_CANDIDATE_SIZE,
      );
      for (const candidate of candidates.items) {
        if (candidate.itemId === itemId) {
          continue;
        }
        try {
          return await assignReviewItem(candidate.itemId);
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 409)) {
            throw error;
          }
        }
      }
      return null;
    },
    onSuccess: (next) => {
      if (next !== null) {
        primeReviewItem(queryClient, next);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [...qualityQueryKeys.reviewItems(), "list"] }),
  });
}
