import { useQuery } from "@tanstack/react-query";
import { analysisQueryKeys } from "../model/queryKeys";
import { getEvent } from "./analysisApi";

/** 이벤트 상세(getEvent). 근거 프레임 서명 주소가 들어 있어 화면을 떠나면 바로 버린다(NFR-3). */
export function useEvent(eventId: string) {
  return useQuery({
    queryKey: analysisQueryKeys.event(eventId),
    queryFn: () => getEvent(eventId),
    gcTime: 0,
  });
}
