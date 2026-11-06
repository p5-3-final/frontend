import { useSearchParams } from "react-router";
import { Panel } from "../../../shared/ui/Panel";
import { useSourceEvents } from "../api/useSourceEvents";
import { parseEventQuery, toEventSearchParams } from "../model/eventFilters";
import type { EventSummary } from "../model/schemas";
import { AnalysisError } from "./AnalysisError";
import { EventFilters } from "./EventFilters";
import { EventList } from "./EventList";

export interface EventsPanelProps {
  sourceId: string;
  selectedId?: string;
  onSelect: (event: EventSummary) => void;
}

/** 이벤트 패널(SPEC-031 R-3). 거르기 값은 URL 쿼리에 둬 주소를 공유하면 같은 목록이 보인다. */
export function EventsPanel({ sourceId, selectedId, onSelect }: EventsPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseEventQuery(searchParams);
  const events = useSourceEvents(sourceId, query);
  const items = events.data?.pages.flatMap((page) => page.items) ?? [];
  const total = events.data?.pages[0]?.page.totalElements;

  return (
    <Panel
      title="이벤트"
      aside={total === undefined ? null : <span className="text-xs text-muted">{total}건</span>}
    >
      <EventFilters
        query={query}
        onChange={(next) => {
          setSearchParams((params) => toEventSearchParams(params, next), { replace: true });
        }}
      />
      {events.isPending ? (
        <p className="text-sm text-muted">이벤트를 불러오는 중입니다.</p>
      ) : events.error !== null ? (
        <AnalysisError
          error={events.error}
          onRetry={() => {
            void events.refetch();
          }}
        />
      ) : (
        <EventList
          events={items}
          selectedId={selectedId}
          onSelect={onSelect}
          hasMore={events.hasNextPage}
          loadingMore={events.isFetchingNextPage}
          onLoadMore={() => {
            void events.fetchNextPage();
          }}
        />
      )}
    </Panel>
  );
}
