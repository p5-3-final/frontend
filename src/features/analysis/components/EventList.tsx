import { ImageOff } from "lucide-react";
import { formatMediaTime } from "../../../shared/lib/format";
import { eventTypeName } from "../../../shared/lib/messages";
import { Button } from "../../../shared/ui/Button";
import type { EventSummary } from "../model/schemas";
import { descriptionText, verificationName } from "../model/verification";
import { SeverityBadge } from "./SeverityBadge";

export interface EventListProps {
  events: EventSummary[];
  selectedId?: string;
  onSelect: (event: EventSummary) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

function firstLine(text: string): string {
  return text.split("\n")[0] ?? "";
}

/** 이벤트 목록(SPEC-031 R-3). 행 전체가 버튼이고 누르면 그 이벤트를 연다(R-5). */
export function EventList({
  events,
  selectedId,
  onSelect,
  hasMore,
  loadingMore,
  onLoadMore,
}: EventListProps) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">조건에 맞는 이벤트가 없습니다.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <ul aria-label="이벤트 목록" className="flex flex-col gap-1">
        {events.map((event) => {
          const name = eventTypeName(event.eventType);
          const time = formatMediaTime(event.startMs);
          const selected = event.eventId === selectedId;
          return (
            <li key={event.eventId}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => {
                  onSelect(event);
                }}
                className={`flex w-full items-start gap-3 rounded-lg border p-2 text-left transition-colors hover:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${selected ? "border-accent bg-accent-soft" : "border-transparent bg-panel-raised"}`}
              >
                {event.thumbnailUrl === null ? (
                  <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded bg-surface text-muted">
                    <ImageOff aria-hidden="true" className="size-4" />
                  </span>
                ) : (
                  <img
                    src={event.thumbnailUrl}
                    alt={`${name} ${time} 썸네일`}
                    loading="lazy"
                    width={80}
                    height={48}
                    className="h-12 w-20 shrink-0 rounded bg-surface object-cover"
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-semibold">{name}</span>
                    <span className="font-mono text-xs text-muted">{time}</span>
                    <SeverityBadge severity={event.severity} />
                    <span className="text-xs text-muted">
                      {verificationName(event.verificationStatus)}
                    </span>
                  </span>
                  <span className="truncate text-xs text-muted">
                    {firstLine(descriptionText(event.verificationStatus, event.description))}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <Button
          variant="secondary"
          disabled={loadingMore}
          onClick={onLoadMore}
          aria-label="이벤트 더 보기"
        >
          더 보기
        </Button>
      )}
    </div>
  );
}
