import { z } from "zod";
import { QUESTION_MESSAGE } from "../../../shared/lib/messages";

/** 계약 answerSourceQuestion의 q: 1~200자 */
export const QUESTION_MAX_LENGTH = 200;

export const questionFormSchema = z.object({
  question: z.string().trim().min(1, QUESTION_MESSAGE).max(QUESTION_MAX_LENGTH, QUESTION_MESSAGE),
});
export type QuestionFormValues = z.infer<typeof questionFormSchema>;
