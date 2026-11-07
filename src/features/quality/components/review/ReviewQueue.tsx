import { ClipboardCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useMe } from "../../../auth";
import { ApiError } from "../../../../shared/api/problem";
import { eventTypeName, messageForCode } from "../../../../shared/lib/messages";
import { formatMediaTime } from "../../../../shared/lib/format";
import { Alert } from "../../../../shared/ui/Alert";
import { Button } from "../../../../shared/ui/Button";
import { EmptyState } from "../../../../shared/ui/EmptyState";
import { Pagination } from "../../../../shared/ui/Pagination";
import { useAssignReviewItem, useReviewItems } from "../../api/review";
import { REVIEW_STATUS_NAMES } from "../../model/names";
import {
  REANALYSIS_NOTICE_SHORT,
  isAutoJudgedAfterReanalysis,
  reviewReasonName,
} from "../../model/reviewReason";
import { readReviewQuery, reviewQueryString, type ReviewQuery } from "../../model/reviewQuery";
import type { ReviewItem } from "../../model/schemas";
import { Cell, DataTable } from "../../ui/DataTable";
import { QualityError } from "../QualityError";
import { ReviewFilters } from "./ReviewFilters";

const COLUMNS = ["유형", "구간", "판정 방식", "사유", "상태", "맡은 사람", ""] as const;

function assigneeLabel(item: ReviewItem, myId: string | undefined): string {
  if (item.assigneeId === null) {
    return "-";
  }
  return item.assigneeId === myId ? "나" : "다른 운영자";
}

/** 검토 큐 목록(SPEC-035 R-2·R-3·R-21). 거르기와 쪽 번호는 URL에 둔다. */
export function ReviewQueue() {
  const [params, setParams] = useSearchParams();
  const { query, page } = readReviewQuery(params);
  const { data: me } = useMe();
  const items = useReviewItems(query, page);
  const assign = useAssignReviewItem();
  const navigate = useNavigate();
  const search = reviewQueryString(query);

  const changeQuery = (next: ReviewQuery) => {
    assign.reset();
    setParams(reviewQueryString(next));
  };
  const changePage = (next: number) => {
    setParams(`${search}&page=${String(next)}`);
  };
  const handleAssign = (itemId: string) => {
    assign.mutate(itemId, {
      onSuccess: () => {
        void navigate(`/quality/review/${itemId}?${search}`);
      },
    });
  };

  return (
    <section aria-labelledby="review-queue-heading" className="flex flex-col gap-4">
      <h2 id="review-queue-heading" className="text-lg font-semibold">
        검토 큐
      </h2>
      <ReviewFilters query={query} onChange={changeQuery} />
      {assign.error !== null && (
        <Alert>
          {assign.error instanceof ApiError
            ? messageForCode(assign.error.code)
            : messageForCode(undefined)}
        </Alert>
      )}
      {items.isPending && <p role="status">검토 항목을 불러오는 중입니다.</p>}
      {items.isError && (
        <QualityError
          error={items.error}
          onRetry={() => {
            void items.refetch();
          }}
        />
      )}
      {items.data?.items.length === 0 && (
        <EmptyState icon={ClipboardCheck} message="조건에 맞는 검토 항목이 없습니다." />
      )}
      {items.data !== undefined && items.data.items.length > 0 && (
        <>
          <DataTable label="검토 항목" columns={COLUMNS}>
            {items.data.items.map((item) => {
              const mine = item.status === "ASSIGNED" && item.assigneeId === me?.id;
              return (
                <tr key={item.itemId}>
                  <Cell>{eventTypeName(item.eventType)}</Cell>
                  <Cell>
                    {formatMediaTime(item.startMs)} ~ {formatMediaTime(item.endMs)}
                  </Cell>
                  <Cell>{item.judgmentMethod}</Cell>
                  <Cell>
                    {reviewReasonName(item.reason)}
                    {isAutoJudgedAfterReanalysis(item.reason) && (
                      <span className="block text-xs text-warning">{REANALYSIS_NOTICE_SHORT}</span>
                    )}
                  </Cell>
                  <Cell>{REVIEW_STATUS_NAMES[item.status]}</Cell>
                  <Cell>{assigneeLabel(item, me?.id)}</Cell>
                  <Cell>
                    {item.status === "UNASSIGNED" ? (
                      <Button
                        variant="secondary"
                        disabled={assign.isPending}
                        onClick={() => {
                          handleAssign(item.itemId);
                        }}
                      >
                        맡기
                      </Button>
                    ) : (
                      <Link
                        to={`/quality/review/${item.itemId}?${search}`}
                        className="font-semibold text-accent underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        {mine ? "이어서 보기" : "보기"}
                      </Link>
                    )}
                  </Cell>
                </tr>
              );
            })}
          </DataTable>
          <Pagination page={page} totalPages={items.data.page.totalPages} onChange={changePage} />
        </>
      )}
    </section>
  );
}
