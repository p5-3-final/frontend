import { useMutation } from "@tanstack/react-query";
import { askTrack } from "./inspectApi";

/** 객체 자유 질문(askTrack, R-7). 202면 requestId를 받고 답은 알림 뒤에 읽는다(R-8). */
export function useAskTrack(trackId: string) {
  return useMutation({
    mutationFn: (request: { question: string; tMs: number }) => askTrack(trackId, request),
  });
}
