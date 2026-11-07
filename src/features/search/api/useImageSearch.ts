import { useMutation, useQueryClient } from "@tanstack/react-query";
import { searchQueryKeys } from "../model/queryKeys";
import { searchMomentsByImage } from "./searchApi";

export interface ImageSearchInput {
  image: File;
  /** 없으면 내 영상 전체에서 찾는다. */
  sourceId?: string | undefined;
}

/**
 * 이미지로 장면 찾기(searchMomentsByImage, SPEC-033 R-8).
 * 파일은 URL에 담을 수 없어 마지막 결과를 메모리 query 캐시에 두고 `?image=last`로 다시 보인다(R-12).
 */
export function useImageSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ image, sourceId }: ImageSearchInput) => searchMomentsByImage(image, sourceId),
    onSuccess: (result) => {
      queryClient.setQueryData(searchQueryKeys.lastImage(), result);
    },
  });
}
