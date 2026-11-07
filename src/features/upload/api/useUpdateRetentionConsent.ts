import { useMutation, useQueryClient } from "@tanstack/react-query";
import { videoQueryKeys } from "../model/queryKeys";
import { updateVideoRetentionConsent } from "./mediaApi";

/** 영상의 학습용 보존 동의 바꾸기(SPEC-034 R-11). 성공하면 상세 캐시를 응답으로 바꾼다. */
export function useUpdateRetentionConsent(videoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (consent: boolean) => updateVideoRetentionConsent(videoId, consent),
    onSuccess: (video) => {
      queryClient.setQueryData(videoQueryKeys.detail(videoId), video);
    },
  });
}
