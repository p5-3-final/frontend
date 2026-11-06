import { z } from "zod";
import { EVENT_TYPES_FOR_FILTER, SEVERITIES, VERDICTS, type ReviewLabel } from "./schemas";

/** 계약 ReviewLabel.note 최대 길이 */
export const NOTE_MAX_LENGTH = 500;
const EMPTY = "";

function oneOf<T extends string>(values: readonly T[]) {
  return z.union([z.literal(EMPTY), z.enum(values)]);
}

// 시각은 사람이 읽기 쉬운 초로 받는다. 빈 칸은 "넣지 않음"이다.
const secondsSchema = z
  .string()
  .trim()
  .regex(/^$|^\d+(\.\d{1,3})?$/, "시각은 0 이상의 초로 넣어 주세요.");

function toMs(seconds: string): number | null {
  return seconds === EMPTY ? null : Math.round(Number(seconds) * 1000);
}

/**
 * 라벨 입력 폼(SPEC-035 R-5). 이벤트 유무가 켜지면 유형·시작·끝이 필수이고 끝 > 시작이며, 꺼지면 유형을 비운다.
 * 검증을 통과하면 계약 ReviewLabel로 바꾼다.
 */
export const labelFormSchema = z
  .object({
    verdict: oneOf(VERDICTS),
    eventPresent: z.boolean(),
    eventType: oneOf(EVENT_TYPES_FOR_FILTER),
    startSec: secondsSchema,
    endSec: secondsSchema,
    severity: oneOf(SEVERITIES),
    note: z.string().max(NOTE_MAX_LENGTH, "메모는 500자까지 쓸 수 있습니다."),
  })
  .superRefine((values, context) => {
    if (values.verdict === EMPTY) {
      context.addIssue({
        code: "custom",
        path: ["verdict"],
        message: "판정이 맞았는지 골라 주세요.",
      });
    }
    if (!values.eventPresent) {
      return;
    }
    if (values.eventType === EMPTY) {
      context.addIssue({
        code: "custom",
        path: ["eventType"],
        message: "이벤트 유형을 골라 주세요.",
      });
    }
    const start = toMs(values.startSec);
    const end = toMs(values.endSec);
    if (start === null || end === null) {
      context.addIssue({
        code: "custom",
        path: ["endSec"],
        message: "이벤트 구간의 시작·끝 시각을 넣어 주세요.",
      });
    } else if (end <= start) {
      context.addIssue({
        code: "custom",
        path: ["endSec"],
        message: "끝 시각은 시작 시각보다 뒤여야 합니다.",
      });
    }
  })
  .transform((values): ReviewLabel => ({
    // superRefine이 빈 verdict를 막으므로 여기서는 언제나 값이 있다. 타입을 좁히려고 한 번 더 확인한다.
    verdict: values.verdict === EMPTY ? "uncertain" : values.verdict,
    eventPresent: values.eventPresent,
    eventType: values.eventPresent && values.eventType !== EMPTY ? values.eventType : null,
    startMs: toMs(values.startSec),
    endMs: toMs(values.endSec),
    severity: values.severity === EMPTY ? null : values.severity,
    note: values.note.trim() === EMPTY ? null : values.note,
  }));

export type LabelFormValues = z.input<typeof labelFormSchema>;

function secondsText(ms: number | null): string {
  return ms === null ? EMPTY : String(ms / 1000);
}

/**
 * 폼 처음 값. 라벨이 있으면 그 값을, 없으면 판정 결과의 유형·구간을 미리 채워 운영자가 고칠 것만 고치게 한다.
 */
export function initialLabelValues(item: {
  eventType: ReviewLabel["eventType"];
  startMs: number;
  endMs: number;
  label: ReviewLabel | null;
}): LabelFormValues {
  const label = item.label;
  if (label !== null) {
    return {
      verdict: label.verdict,
      eventPresent: label.eventPresent,
      eventType: label.eventType ?? EMPTY,
      startSec: secondsText(label.startMs),
      endSec: secondsText(label.endMs),
      severity: label.severity ?? EMPTY,
      note: label.note ?? EMPTY,
    };
  }
  return {
    verdict: EMPTY,
    eventPresent: true,
    eventType: item.eventType ?? EMPTY,
    startSec: secondsText(item.startMs),
    endSec: secondsText(item.endMs),
    severity: EMPTY,
    note: EMPTY,
  };
}
