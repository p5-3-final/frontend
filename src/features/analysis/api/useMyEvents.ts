import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { MyEventQuery } from "../model/eventFilters";
import { analysisQueryKeys } from "../model/queryKeys";
import { listMyEvents } from "./analysisApi";

/** 내 영상 전체의 이벤트 한 쪽(listMyEvents). 쪽을 넘기는 동안 이전 쪽을 보인다. */
export function useMyEvents(query: MyEventQuery, page: number) {
  return useQuery({
    queryKey: analysisQueryKeys.myEvents(query, page),
    queryFn: () => listMyEvents(query, page),
    placeholderData: keepPreviousData,
    gcTime: 0,
  });
}
