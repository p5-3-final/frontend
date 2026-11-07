import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useMomentFeedback } from "../api/useMomentFeedback";

export interface FeedbackButtonsProps {
  momentId: string;
}

type Verdict = "correct" | "incorrect";

const BUTTON_CLASS =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm text-muted hover:border-accent hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent";

/** 결과 맞음·틀림(SPEC-033 R-11). 누르면 표시를 먼저 바꾸고, 결과·종류마다 기록을 한 번만 보낸다. */
export function FeedbackButtons({ momentId }: FeedbackButtonsProps) {
  const feedback = useMomentFeedback();
  // 영상 상세에 갔다 돌아와도 고른 표시가 남게 보낸 기록에서 처음 값을 정한다.
  const [verdict, setVerdict] = useState<Verdict | undefined>(() => {
    if (feedback.hasSent(momentId, "incorrect")) {
      return "incorrect";
    }
    return feedback.hasSent(momentId, "correct") ? "correct" : undefined;
  });
  const choose = (next: Verdict) => {
    setVerdict(next);
    feedback.send(momentId, next);
  };
  return (
    <div role="group" aria-label="결과 평가" className="flex gap-2">
      <button
        type="button"
        aria-pressed={verdict === "correct"}
        className={BUTTON_CLASS}
        onClick={() => {
          choose("correct");
        }}
      >
        <ThumbsUp aria-hidden="true" className="size-4" />
        맞음
      </button>
      <button
        type="button"
        aria-pressed={verdict === "incorrect"}
        className={BUTTON_CLASS}
        onClick={() => {
          choose("incorrect");
        }}
      >
        <ThumbsDown aria-hidden="true" className="size-4" />
        틀림
      </button>
    </div>
  );
}
