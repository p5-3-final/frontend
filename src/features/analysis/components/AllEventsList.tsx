import { useId } from "react";
import { Link, useSearchParams } from "react-router";
import { formatMediaTime } from "../../../shared/lib/format";
import { eventTypeName, REVIEW_STATE_NAMES } from "../../../shared/lib/messages";
import { Pagination } from "../../../shared/ui/Pagination";
import { videoDetailPath } from "../../upload";
import { useMyEvents } from "../api/useMyEvents";
import {
  parseMyEventFilters,
  toMyEventQuery,
  toMyEventSearchParams,
  type MyEventFilters,
} from "../model/eventFilters";
import { descriptionText, verificationName } from "../model/verification";
import { AnalysisError } from "./AnalysisError";
import { EventFilters } from "./EventFilters";
import { SeverityBadge } from "./SeverityBadge";

/**
 * 내 영상 전체의 이벤트(SPEC-031 R-11). 저장 시각 최신순으로 20건씩 보이고, 거르기·기간·쪽 번호는 URL 쿼리에 둔다.
 * 이벤트를 누르면 그 영상 상세가 그 이벤트가 열린 상태(?event=)로 열린다.
 */
export function AllEventsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseMyEventFilters(searchParams);
  const { data, error, isPending, refetch } = useMyEvents(toMyEventQuery(filters), filters.page);
  const fromId = useId();
  const toId = useId();

  const update = (next: MyEventFilters) => {
    setSearchParams(toMyEventSearchParams(next), { replace: true });
  };
  const changeDate = (key: "fromDate" | "toDate", value: string) => {
    const next: MyEventFilters = { query: filters.query, page: 0 };
    const fromDate = key === "fromDate" ? value : (filters.fromDate ?? "");
    const toDate = key === "toDate" ? value : (filters.toDate ?? "");
    update({
      ...next,
      ...(fromDate === "" ? {} : { fromDate }),
      ...(toDate === "" ? {} : { toDate }),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-panel p-4">
        <EventFilters
          query={filters.query}
          onChange={(query) => {
            update({ ...filters, query, page: 0 });
          }}
        />
        <div className="grid grid-cols-2 gap-2 sm:max-w-md">
          <div className="flex flex-col gap-1">
            <label htmlFor={fromId} className="text-xs text-muted">
              시작일
            </label>
            <input
              id={fromId}
              type="date"
              value={filters.fromDate ?? ""}
              onChange={(event) => {
                changeDate("fromDate", event.target.value);
              }}
              className="h-9 rounded-lg border border-line bg-panel-raised px-2 text-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={toId} className="text-xs text-muted">
              종료일
            </label>
            <input
              id={toId}
              type="date"
              value={filters.toDate ?? ""}
              onChange={(event) => {
                changeDate("toDate", event.target.value);
              }}
              className="h-9 rounded-lg border border-line bg-panel-raised px-2 text-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            />
          </div>
        </div>
      </div>
      {isPending ? (
        <p className="text-sm text-muted">이벤트를 불러오는 중입니다.</p>
      ) : error !== null ? (
        <AnalysisError
          error={error}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : data.items.length === 0 ? (
        <p className="text-sm text-muted">조건에 맞는 이벤트가 없습니다.</p>
      ) : (
        <>
          <ul aria-label="전체 이벤트" className="flex flex-col gap-1">
            {data.items.map((event) => (
              <li key={event.eventId}>
                <Link
                  to={videoDetailPath(event.sourceId, { eventId: event.eventId })}
                  className="flex flex-col gap-0.5 rounded-lg border border-transparent bg-panel p-3 text-sm hover:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold">{eventTypeName(event.eventType)}</span>
                    <span className="font-mono text-xs text-muted">
                      {formatMediaTime(event.startMs)}
                    </span>
                    <SeverityBadge severity={event.severity} />
                    <span className="text-xs text-muted">
                      {verificationName(event.verificationStatus)}
                    </span>
                    {event.reviewState !== "UNREVIEWED" && (
                      <span className="rounded bg-surface px-1.5 text-xs">
                        {REVIEW_STATE_NAMES[event.reviewState]}
                      </span>
                    )}
                    {event.zoneName !== null && (
                      <span className="text-xs text-muted">{event.zoneName}</span>
                    )}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {descriptionText(event.verificationStatus, event.description)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            page={filters.page}
            totalPages={data.page.totalPages}
            onChange={(page) => {
              update({ ...filters, page });
            }}
          />
        </>
      )}
    </div>
  );
}
