import type { MomentSearchResult } from "../model/schemas";
import { MomentResultItem } from "./MomentResultItem";

export interface MomentResultsProps {
  result: MomentSearchResult;
}

/** 검색 결과 목록(SPEC-033 R-1). 서버가 준 순서 그대로 그리고 다시 정렬하지 않는다. */
export function MomentResults({ result }: MomentResultsProps) {
  return (
    <ul aria-label="검색 결과" className="flex flex-col gap-2">
      {result.results.map((moment) => (
        <MomentResultItem key={moment.momentId} moment={moment} />
      ))}
    </ul>
  );
}
