import { useMutation } from "@tanstack/react-query";
import { answerSourceQuestion } from "./searchApi";

/**
 * 영상에 질문(answerSourceQuestion, SPEC-033 R-9). 질문 버튼을 눌렀을 때만 묻는다.
 * 서버가 VLM 답을 만드느라 15초까지 걸릴 수 있어 캐시하지 않고 요청마다 새로 받는다.
 */
export function useAnswerQuestion(sourceId: string) {
  return useMutation({
    mutationFn: (question: string) => answerSourceQuestion(sourceId, question),
  });
}
