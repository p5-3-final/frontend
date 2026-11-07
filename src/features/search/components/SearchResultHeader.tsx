import { Info, TriangleAlert } from "lucide-react";
import { useId } from "react";
import {
  PARSE_METHOD_NAMES,
  SEARCH_APPEARANCE_NOTICE,
  SEARCH_REUSED_NOTICE,
} from "../../../shared/lib/messages";
import { degradedMessage } from "../model/degraded";
import type { MomentSearchResult } from "../model/schemas";

export interface SearchResultHeaderProps {
  result: MomentSearchResult;
}

/** 결과 위 안내: 해석된 대상어와 해석 방법, 장면 외형 기준, 재사용, 축소 응답(SPEC-033 R-2, R-4). */
export function SearchResultHeader({ result }: SearchResultHeaderProps) {
  const headingId = useId();
  const degraded = degradedMessage(result.degraded);
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 rounded-xl border border-line bg-panel p-4 text-sm"
    >
      <h2 id={headingId} className="sr-only">
        검색 결과 안내
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        {result.targets.map((target) => (
          <span
            key={target}
            className="rounded-full border border-accent/40 bg-accent-soft px-2.5 py-0.5 text-accent"
          >
            {target}
          </span>
        ))}
        <span className="text-muted">{PARSE_METHOD_NAMES[result.parseMethod]}</span>
      </div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        <span>{SEARCH_APPEARANCE_NOTICE}</span>
        {result.reused && <span className="text-content">{SEARCH_REUSED_NOTICE}</span>}
      </p>
      {degraded !== undefined && (
        <p className="flex items-center gap-1.5 text-warning">
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
          {degraded}
        </p>
      )}
    </section>
  );
}
