import { SearchX } from "lucide-react";
import {
  SEARCH_NOT_FOUND_MESSAGE,
  VIDEO_NAME_FAILED,
  VIDEO_NAME_LOADING,
} from "../../../shared/lib/messages";
import { useVideoNames, type VideoName } from "../api/useVideoNames";
import type { MomentSearchResult } from "../model/schemas";
import { MomentResultItem } from "./MomentResultItem";
import { SearchResultHeader } from "./SearchResultHeader";

export interface MomentResultsProps {
  result: MomentSearchResult;
}

/**
 * 검색 결과(SPEC-033 R-1~R-4). 서버가 준 순서 그대로 그리고 다시 정렬하지 않는다.
 * 정밀 검색에서 기준을 넘은 결과가 없으면(notFound) "찾지 못함"을 먼저 보이고 결과는 참고용으로 흐리게 보인다.
 */
export function MomentResults({ result }: MomentResultsProps) {
  // R-7: 내 영상 전체 결과에만 영상 이름을 붙인다. 영상 범위는 고른 영상 하나라 이름을 묻지 않는다.
  const showNames = result.scope === "all";
  const names = useVideoNames(
    result.results.map((moment) => moment.sourceId),
    showNames,
  );
  return (
    <div className="flex flex-col gap-3">
      <SearchResultHeader result={result} />
      {result.notFound && (
        <p className="flex items-center gap-2 rounded-xl border border-line bg-panel p-4 font-semibold">
          <SearchX aria-hidden="true" className="size-5 text-muted" />
          {SEARCH_NOT_FOUND_MESSAGE}
        </p>
      )}
      {result.results.length === 0 ? (
        !result.notFound && (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            {SEARCH_NOT_FOUND_MESSAGE}
          </p>
        )
      ) : (
        <>
          {result.notFound && <h2 className="text-sm font-semibold text-muted">참고 결과</h2>}
          <ul
            aria-label={result.notFound ? "참고 결과" : "검색 결과"}
            className={`flex flex-col gap-2 ${result.notFound ? "opacity-60" : ""}`}
          >
            {result.results.map((moment) => (
              <MomentResultItem
                key={moment.momentId}
                moment={moment}
                videoName={showNames ? videoNameText(names.get(moment.sourceId)) : undefined}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function videoNameText(name: VideoName | undefined): string {
  if (name?.status === "success") {
    return name.fileName;
  }
  return name?.status === "error" ? VIDEO_NAME_FAILED : VIDEO_NAME_LOADING;
}
