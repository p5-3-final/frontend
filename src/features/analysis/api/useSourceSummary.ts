import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { analysisQueryKeys } from "../model/queryKeys";
import { getSourceSummary } from "./analysisApi";

// URL의 영상 ID는 사용자가 바꿀 수 있는 입력이라 UUID 형식일 때만 묻는다(영상 상세와 같은 기준).
const sourceIdSchema = z.guid();

/** 영상 분석 요약(getSourceSummary). 결과 패널을 그릴지(READY) 정하는 첫 요청이다(SPEC-031 R-1). */
export function useSourceSummary(sourceId: string) {
  return useQuery({
    queryKey: analysisQueryKeys.summary(sourceId),
    queryFn: () => getSourceSummary(sourceId),
    enabled: sourceIdSchema.safeParse(sourceId).success,
  });
}
