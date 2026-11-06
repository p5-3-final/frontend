import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { useReviewEvent } from "../api/useReviewEvent";
import { reviewFormSchema, toReviewRequest, type ReviewFormValues } from "../model/review";
import type { EventDetail, ReviewState } from "../model/schemas";

export interface EventReviewFormProps {
  detail: EventDetail;
}

const OPTIONS: readonly { value: ReviewState; label: string }[] = [
  { value: "CONFIRMED", label: "확인" },
  { value: "DISMISSED", label: "기각" },
  { value: "UNREVIEWED", label: "되돌리기" },
];

/** 운영자 확인·기각·되돌리기와 메모(SPEC-031 R-7). OPERATOR에게만 그린다. */
export function EventReviewForm({ detail }: EventReviewFormProps) {
  const review = useReviewEvent(detail.event.eventId);
  const noteId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { reviewState: detail.event.reviewState, note: detail.reviewNote ?? "" },
  });

  const failure =
    review.error === null
      ? undefined
      : messageForCode(review.error instanceof ApiError ? review.error.code : undefined);

  return (
    <form
      aria-label="이벤트 확인·기각"
      noValidate
      className="flex flex-col gap-2 border-t border-line pt-3"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          review.mutate(toReviewRequest(values));
        })(event);
      }}
    >
      {failure !== undefined && <Alert>{failure}</Alert>}
      {review.isSuccess && <Alert tone="success">저장했습니다.</Alert>}
      <fieldset className="flex flex-wrap gap-3">
        <legend className="mb-1 text-xs font-semibold text-muted">운영자 확인</legend>
        {OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-1.5 text-sm">
            <input type="radio" value={option.value} {...register("reviewState")} />
            {option.label}
          </label>
        ))}
      </fieldset>
      <label htmlFor={noteId} className="text-xs text-muted">
        메모
      </label>
      <textarea
        id={noteId}
        rows={2}
        aria-invalid={errors.note === undefined ? undefined : true}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 aria-invalid:border-danger"
        {...register("note")}
      />
      {errors.note?.message !== undefined && (
        <p className="text-sm text-danger">{errors.note.message}</p>
      )}
      <Button type="submit" disabled={review.isPending} className="self-start">
        저장
      </Button>
    </form>
  );
}
