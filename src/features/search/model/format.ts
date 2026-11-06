import { formatMediaTime } from "../../../shared/lib/format";
import { MATCHED_BY_NAMES } from "../../../shared/lib/messages";
import type { MatchedBy } from "./schemas";

/** 구간 "mm:ss–mm:ss" */
export function formatRange(startMs: number, endMs: number): string {
  return `${formatMediaTime(startMs)}–${formatMediaTime(endMs)}`;
}

/** 유사도는 확률·퍼센트가 아니라 RRF로 합친 값이라 소수 둘째 자리 숫자로만 보인다(계약 MomentResult.similarity). */
export function formatSimilarity(similarity: number): string {
  return `유사도 ${similarity.toFixed(2)}`;
}

/** 찾은 경로. 예: ["visual", "text"] → "시각·텍스트" */
export function formatMatchedBy(matchedBy: readonly MatchedBy[]): string {
  return matchedBy.map((path) => MATCHED_BY_NAMES[path]).join("·");
}
