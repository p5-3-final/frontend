import { z } from "zod";
import { reviewStateSchema, type ReviewEventRequest } from "./schemas";

// 계약 ReviewEventRequest note는 길이 제한이 없어 화면이 정한 값이다(plan 4절 메모 500자).
const NOTE_MAX = 500;

/** 운영자 확인·기각 폼(SPEC-031 R-7) */
export const reviewFormSchema = z.object({
  reviewState: reviewStateSchema,
  note: z.string().max(NOTE_MAX, `메모는 ${String(NOTE_MAX)}자까지 쓸 수 있습니다.`),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

/** 폼 값을 요청 본문으로 바꾼다. 빈 메모는 null로 보낸다. */
export function toReviewRequest(values: ReviewFormValues): ReviewEventRequest {
  const note = values.note.trim();
  return { reviewState: values.reviewState, note: note === "" ? null : note };
}
