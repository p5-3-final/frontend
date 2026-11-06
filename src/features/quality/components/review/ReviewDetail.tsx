import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { SeverityBadge, vlmAnalysisSchema } from "../../../analysis";
import { useMe } from "../../../auth";
import { ApiError } from "../../../../shared/api/problem";
import { formatMediaTime } from "../../../../shared/lib/format";
import { VERIFICATION_NAMES, eventTypeName, messageForCode } from "../../../../shared/lib/messages";
import { Alert } from "../../../../shared/ui/Alert";
import { Button } from "../../../../shared/ui/Button";
import { Panel } from "../../../../shared/ui/Panel";
import { useLabelAndNext, useReleaseReviewItem, useReviewItem } from "../../api/review";
import { REVIEW_STATUS_NAMES } from "../../model/names";
import {
  REANALYSIS_NOTICE,
  isAutoJudgedAfterReanalysis,
  reviewReasonName,
} from "../../model/reviewReason";
import { readReviewQuery, reviewQueryString } from "../../model/reviewQuery";
import type { ReviewItem } from "../../model/schemas";
import { QualityError } from "../QualityError";
import { AddToGoldenSet } from "./AddToGoldenSet";
import { EvidenceFrames } from "./EvidenceFrames";
import { ReviewLabelForm } from "./ReviewLabelForm";

function errorMessage(error: Error | null): string | undefined {
  if (error === null) {
    return undefined;
  }
  return messageForCode(error instanceof ApiError ? error.code : undefined);
}

function JudgmentResult({ item }: { item: ReviewItem }) {
  const analysis = vlmAnalysisSchema.safeParse(item.analysis);
  return (
    <Panel title="판정 결과">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">유형·구간</dt>
        <dd>
          {eventTypeName(item.eventType)} · {formatMediaTime(item.startMs)} ~{" "}
          {formatMediaTime(item.endMs)}
        </dd>
        {analysis.success ? (
          <>
            <dt className="text-muted">설명</dt>
            <dd>{analysis.data.description ?? "-"}</dd>
            <dt className="text-muted">위험 사유</dt>
            <dd>{analysis.data.riskReason ?? "-"}</dd>
            <dt className="text-muted">심각도</dt>
            <dd>
              {analysis.data.severity === null ? (
                "-"
              ) : (
                <SeverityBadge severity={analysis.data.severity} />
              )}
            </dd>
            <dt className="text-muted">판정 상태</dt>
            <dd>{VERIFICATION_NAMES[analysis.data.verificationStatus]}</dd>
          </>
        ) : (
          <>
            <dt className="text-muted">판정 결과</dt>
            <dd>판정 결과를 읽을 수 없습니다.</dd>
          </>
        )}
        <dt className="text-muted">판정 방식</dt>
        <dd>{item.judgmentMethod}</dd>
        <dt className="text-muted">검토 사유</dt>
        <dd>{reviewReasonName(item.reason)}</dd>
        <dt className="text-muted">판정 이유</dt>
        <dd>{item.reviewReasons.length === 0 ? "-" : item.reviewReasons.join(", ")}</dd>
        <dt className="text-muted">상태</dt>
        <dd>{REVIEW_STATUS_NAMES[item.status]}</dd>
      </dl>
    </Panel>
  );
}

/** 검토 상세(SPEC-035 R-4~R-7, R-9, R-21). 맡기 → 라벨 → "저장 후 다음"이 이 화면에서 이어진다. */
export function ReviewDetail() {
  const { itemId = "" } = useParams();
  const [params] = useSearchParams();
  const { query } = readReviewQuery(params);
  const search = reviewQueryString(query);
  const listPath = `/quality/review?${search}`;
  const navigate = useNavigate();
  const { data: me } = useMe();
  const detail = useReviewItem(itemId);
  const labelAndNext = useLabelAndNext(query);
  const release = useReleaseReviewItem();

  const back = (
    <Link
      to={listPath}
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      검토 큐로
    </Link>
  );

  if (detail.isPending) {
    return <p role="status">검토 항목을 불러오는 중입니다.</p>;
  }
  if (detail.isError) {
    return (
      <div className="flex flex-col gap-3">
        {back}
        <QualityError
          error={detail.error}
          onRetry={() => {
            void detail.refetch();
          }}
        />
      </div>
    );
  }
  const item = detail.data;
  const editable = item.status === "ASSIGNED" && item.assigneeId === me?.id;

  const handleSubmit = (label: Parameters<typeof labelAndNext.mutate>[0]["label"]) => {
    labelAndNext.mutate(
      { itemId: item.itemId, label },
      {
        onSuccess: (next) => {
          if (next !== null) {
            void navigate(`/quality/review/${next.itemId}?${search}`, { replace: true });
          }
        },
      },
    );
  };
  const handleRelease = () => {
    release.mutate(item.itemId, {
      onSuccess: () => {
        void navigate(listPath);
      },
    });
  };

  return (
    <section aria-labelledby="review-detail-heading" className="flex flex-col gap-4">
      {back}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="review-detail-heading" className="text-lg font-semibold">
          검토 상세
        </h2>
        {editable && (
          <Button variant="secondary" disabled={release.isPending} onClick={handleRelease}>
            내려놓기
          </Button>
        )}
      </div>
      {isAutoJudgedAfterReanalysis(item.reason) && (
        <Alert tone="success">{REANALYSIS_NOTICE}</Alert>
      )}
      {release.error !== null && <Alert>{errorMessage(release.error)}</Alert>}
      {labelAndNext.data === null && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel-raised px-4 py-3"
        >
          <p className="font-semibold">남은 항목이 없습니다.</p>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <EvidenceFrames
            key={item.itemId}
            urls={item.evidenceFrameUrls}
            onExpired={() => {
              void detail.refetch();
            }}
          />
          <JudgmentResult item={item} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <ReviewLabelForm
            key={`${item.itemId}-${item.status}`}
            item={item}
            editable={editable}
            pending={labelAndNext.isPending}
            error={errorMessage(labelAndNext.error)}
            onSubmit={handleSubmit}
          />
          {item.status === "LABELED" && <AddToGoldenSet key={item.itemId} item={item} />}
        </div>
      </div>
    </section>
  );
}
