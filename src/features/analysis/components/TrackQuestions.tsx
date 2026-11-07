import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useNotification } from "../../notifications";
import type { PlayerController } from "../../player";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { useAskTrack } from "../api/useAskTrack";
import { questionFormSchema, type QuestionForm } from "../model/inspectSchemas";
import { QuestionItem } from "./QuestionItem";

export interface TrackQuestionsProps {
  sourceId: string;
  trackId: string;
  controller: PlayerController;
}

interface AskedQuestion {
  requestId: string;
  question: string;
}

/**
 * 트랙 패널의 객체 질문과 이력(SPEC-032 R-7~R-9). 이력은 패널을 연 동안만 화면 상태로 둔다.
 */
export function TrackQuestions({ sourceId, trackId, controller }: TrackQuestionsProps) {
  const [history, setHistory] = useState<AskedQuestion[]>([]);
  // R-8: 알림이 질문 접수(202) 응답보다 먼저 올 수 있어 requestId별 결과를 이력과 따로 모은다.
  const [outcomes, setOutcomes] = useState<ReadonlyMap<string, "READY" | "FAILED">>(new Map());
  useNotification(
    "track.analyzed",
    (message) => {
      if (message.data.trackId !== trackId || message.data.reason !== "question") {
        return;
      }
      const { requestId, outcome } = message.data;
      setOutcomes((previous) => new Map([...previous, [requestId, outcome]]));
    },
    { sourceId, replayBuffered: true },
  );
  const ask = useAskTrack(trackId);
  const inputId = useId();
  const errorId = useId();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuestionForm>({ resolver: zodResolver(questionFormSchema) });

  const submit = handleSubmit((values) => {
    ask.mutate(
      // 질문할 때 보던 화면 시각으로 장면 프레임을 고른다(계약 AskRequest.tMs).
      { question: values.question, tMs: controller.getCurrentMs() },
      {
        onSuccess: (accepted) => {
          setHistory((previous) =>
            previous.some((item) => item.requestId === accepted.requestId)
              ? previous
              : [{ requestId: accepted.requestId, question: values.question }, ...previous],
          );
          reset();
        },
      },
    );
  });
  const error = errors.question?.message;
  // R-9: 429(ANALYSIS_QUESTION_RATE_LIMITED)도 code 문구로 보인다. 이력에는 넣지 않는다.
  const askError =
    ask.error === null
      ? undefined
      : messageForCode(ask.error instanceof ApiError ? ask.error.code : undefined);

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <form
        noValidate
        onSubmit={(event) => {
          void submit(event);
        }}
        className="flex flex-col gap-1.5"
      >
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          객체에 질문
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            placeholder="예: 이 사람이 들고 있는 것은?"
            aria-invalid={error === undefined ? undefined : true}
            aria-describedby={error === undefined ? undefined : errorId}
            className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 outline-none placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/30 aria-invalid:border-danger"
            {...register("question")}
          />
          <Button type="submit" disabled={ask.isPending}>
            질문 보내기
          </Button>
        </div>
        {error !== undefined && (
          <p id={errorId} className="text-sm text-danger">
            {error}
          </p>
        )}
      </form>
      {askError !== undefined && <Alert>{askError}</Alert>}
      {history.length > 0 && (
        <ul aria-label="질문 이력" className="flex flex-col gap-2">
          {history.map((item) => (
            <QuestionItem
              key={item.requestId}
              trackId={trackId}
              requestId={item.requestId}
              question={item.question}
              outcome={outcomes.get(item.requestId)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
