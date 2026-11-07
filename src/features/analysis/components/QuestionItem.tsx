import { VERIFICATION_NAMES } from "../../../shared/lib/messages";
import { useTrackQuestion } from "../api/useTrackQuestion";

export interface QuestionItemProps {
  trackId: string;
  requestId: string;
  question: string;
  /** track.analyzed(question)로 받은 결과. 아직 안 왔으면 undefined다. */
  outcome: "READY" | "FAILED" | undefined;
}

const FAILED_MESSAGE = "답을 만들지 못했습니다.";

/** 질문 이력 한 줄(SPEC-032 R-7, R-8) */
export function QuestionItem({ trackId, requestId, question, outcome }: QuestionItemProps) {
  const result = useTrackQuestion(trackId, requestId, outcome === "READY");
  return (
    <li className="flex flex-col gap-1 rounded-lg bg-panel-raised px-3 py-2 text-sm">
      <p className="font-semibold">{question}</p>
      <Answer outcome={outcome} result={result} />
    </li>
  );
}

function Answer({
  outcome,
  result,
}: {
  outcome: QuestionItemProps["outcome"];
  result: ReturnType<typeof useTrackQuestion>;
}) {
  if (outcome === undefined) {
    return <p className="text-muted">답을 기다리는 중</p>;
  }
  if (outcome === "FAILED" || result.error !== null) {
    return <p className="text-danger">{FAILED_MESSAGE}</p>;
  }
  if (result.data === undefined) {
    return <p className="text-muted">답을 불러오는 중</p>;
  }
  const { status, answer } = result.data;
  if (status === "FAILED" || answer === null) {
    return <p className="text-danger">{FAILED_MESSAGE}</p>;
  }
  if (status === "REQUESTED") {
    return <p className="text-muted">답을 기다리는 중</p>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      <p>
        {answer.answerable === false ? "화면만으로는 답할 수 없습니다." : (answer.answer ?? "-")}
      </p>
      <p className="text-xs text-muted">{`판정 상태: ${VERIFICATION_NAMES[answer.verificationStatus]}`}</p>
    </div>
  );
}
