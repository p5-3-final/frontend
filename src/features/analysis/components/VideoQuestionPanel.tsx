import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircleQuestion, Search } from "lucide-react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { ApiError } from "../../../shared/api/problem";
import { formatMediaTime } from "../../../shared/lib/format";
import {
  ANSWER_MISSING_MESSAGE,
  ANSWER_STATUS_NAMES,
  eventTypeName,
  messageForCode,
} from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import type { PlayerController } from "../../player";
import {
  degradedMessage,
  formatRange,
  sourceSearchPath,
  useAnswerQuestion,
  type AnswerResult,
} from "../../search";
import {
  QUESTION_MAX_LENGTH,
  questionFormSchema,
  type QuestionFormValues,
} from "../model/question";

export interface VideoQuestionPanelProps {
  sourceId: string;
  controller: PlayerController;
}

const JUMP_BUTTON_CLASS =
  "flex w-full items-start gap-3 rounded-lg border border-line bg-panel-raised p-2 text-left text-sm hover:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

/**
 * 영상 상세 "영상에 질문"(SPEC-033 R-9, R-10). search-service가 근거 구간·이벤트만으로 답한다.
 * 근거나 관련 이벤트를 누르면 같은 화면의 플레이어를 그 시각으로 옮긴다.
 */
export function VideoQuestionPanel({ sourceId, controller }: VideoQuestionPanelProps) {
  const ask = useAnswerQuestion(sourceId);
  const inputId = useId();
  const errorId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: { question: "" },
  });
  const inputError = errors.question?.message;

  return (
    <Panel
      title="영상에 질문"
      aside={
        <Link
          to={sourceSearchPath(sourceId)}
          className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Search aria-hidden="true" className="size-4" />이 영상에서 검색
        </Link>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-1.5"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            ask.mutate(values.question);
          })(event);
        }}
      >
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          질문
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="text"
            maxLength={QUESTION_MAX_LENGTH}
            placeholder="예: 방호벽은 언제 치워졌나요?"
            aria-invalid={inputError === undefined ? undefined : true}
            aria-describedby={inputError === undefined ? undefined : errorId}
            className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-content outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 aria-invalid:border-danger"
            {...register("question")}
          />
          {/* 답을 만드는 데 15초까지 걸릴 수 있어 기다리는 동안 같은 질문을 다시 보내지 않게 막는다. */}
          <Button type="submit" disabled={ask.isPending}>
            <MessageCircleQuestion aria-hidden="true" className="size-4" />
            {ask.isPending ? "답을 만드는 중" : "질문하기"}
          </Button>
        </div>
        {inputError !== undefined && (
          <p id={errorId} className="text-sm text-danger">
            {inputError}
          </p>
        )}
      </form>
      {ask.error !== null && (
        <Alert>{messageForCode(ask.error instanceof ApiError ? ask.error.code : undefined)}</Alert>
      )}
      {ask.data !== undefined && <AnswerView answer={ask.data} controller={controller} />}
    </Panel>
  );
}

function AnswerView({
  answer,
  controller,
}: {
  answer: AnswerResult;
  controller: PlayerController;
}) {
  const degraded = degradedMessage(answer.degraded);
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-3">
        <span className="self-start rounded-full border border-line px-2 py-0.5 text-xs text-muted">
          {ANSWER_STATUS_NAMES[answer.status]}
        </span>
        {/* R-10: 모델이 없거나 시간이 초과되면 답 없이 근거만 온다. */}
        <p className={answer.answer === null ? "text-muted" : "text-base"}>
          {answer.answer ?? ANSWER_MISSING_MESSAGE}
        </p>
        {degraded !== undefined && <p className="text-warning">{degraded}</p>}
      </div>
      {answer.evidence.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-muted">근거 구간</h3>
          <ul className="flex flex-col gap-1.5">
            {answer.evidence.map((moment) => {
              const range = formatRange(moment.startMs, moment.endMs);
              return (
                <li key={moment.momentId}>
                  <button
                    type="button"
                    aria-label={`근거 ${range}로 이동`}
                    className={JUMP_BUTTON_CLASS}
                    onClick={() => {
                      controller.seek(moment.seekMs);
                    }}
                  >
                    {moment.thumbnailUrl !== null && (
                      <img
                        src={moment.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        width={96}
                        height={54}
                        className="h-13.5 w-24 shrink-0 rounded bg-surface object-cover"
                      />
                    )}
                    <span className="tabular-nums">{range}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {answer.relatedEvents.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-muted">관련 이벤트</h3>
          <ul className="flex flex-col gap-1.5">
            {answer.relatedEvents.map((event) => {
              const label = `${eventTypeName(event.eventType)} ${formatMediaTime(event.startMs)}`;
              return (
                <li key={event.eventId}>
                  <button
                    type="button"
                    aria-label={`${label} 이벤트로 이동`}
                    className={`${JUMP_BUTTON_CLASS} flex-col gap-0.5`}
                    onClick={() => {
                      controller.seek(event.seekMs);
                    }}
                  >
                    <span className="font-semibold">{label}</span>
                    {event.description !== null && (
                      <span className="text-muted">{event.description}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {answer.limitations.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="font-semibold text-muted">한계</h3>
          <ul className="list-disc pl-5 text-muted">
            {answer.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
