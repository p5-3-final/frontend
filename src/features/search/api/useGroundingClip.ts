import { useQuery } from "@tanstack/react-query";
import { searchQueryKeys } from "../model/queryKeys";
import { getGroundingClip } from "./searchApi";

/**
 * 주석 클립 정보(getGroundingClip). READY일 때만 묻는다(SPEC-033 R-5).
 * 클립 주소는 서명 주소라 화면에서 쓰는 동안만 메모리에 두고, 화면을 떠나면 바로 버린다(NFR-2).
 */
export function useGroundingClip(groundingId: string, enabled: boolean) {
  return useQuery({
    queryKey: searchQueryKeys.groundingClip(groundingId),
    queryFn: () => getGroundingClip(groundingId),
    enabled,
    gcTime: 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
