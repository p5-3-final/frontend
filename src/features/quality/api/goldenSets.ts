import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qualityQueryKeys } from "../model/queryKeys";
import type { CreateGoldenSetRequest } from "../model/schemas";
import {
  addGoldenSetEntry,
  createGoldenSet,
  createGoldenSetVersion,
  deleteGoldenSetEntry,
  getGoldenSet,
  listGoldenSetEntries,
  listGoldenSetVersions,
  listGoldenSets,
  setGoldenSetBaseline,
} from "./qualityApi";

/** Golden Set 목록(listGoldenSets, SPEC-035 R-8). 고르기·이름 찾기에도 쓴다. */
export function useGoldenSets() {
  return useQuery({ queryKey: qualityQueryKeys.goldenSetList(), queryFn: listGoldenSets });
}

export function useGoldenSet(setId: string) {
  return useQuery({
    queryKey: qualityQueryKeys.goldenSet(setId),
    queryFn: () => getGoldenSet(setId),
  });
}

export function useGoldenSetEntries(setId: string) {
  return useQuery({
    queryKey: qualityQueryKeys.goldenEntries(setId),
    queryFn: () => listGoldenSetEntries(setId),
  });
}

export function useGoldenSetVersions(setId: string) {
  return useQuery({
    queryKey: qualityQueryKeys.goldenVersions(setId),
    queryFn: () => listGoldenSetVersions(setId),
  });
}

/** Golden Set 만들기(createGoldenSet, R-8) */
export function useCreateGoldenSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateGoldenSetRequest) => createGoldenSet(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qualityQueryKeys.goldenSets() }),
  });
}

/** 초안에 검토 항목 넣기(addGoldenSetEntry, R-9). 초안 수가 바뀌므로 세트 query를 모두 다시 받는다. */
export function useAddGoldenSetEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ setId, reviewItemId }: { setId: string; reviewItemId: string }) =>
      addGoldenSetEntry(setId, reviewItemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qualityQueryKeys.goldenSets() }),
  });
}

/** 초안 항목 빼기(deleteGoldenSetEntry, R-10) */
export function useDeleteGoldenSetEntry(setId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => deleteGoldenSetEntry(setId, entryId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qualityQueryKeys.goldenSets() }),
  });
}

/** 버전 확정(createGoldenSetVersion, R-10). 세트·초안·버전 query를 다시 받는다. */
export function useFreezeGoldenSet(setId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => createGoldenSetVersion(setId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qualityQueryKeys.goldenSets() }),
  });
}

/** 기준 실행 지정(setGoldenSetBaseline, R-11). 세트와 실행 query를 다시 받는다. */
export function useSetBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ setId, runId }: { setId: string; runId: string }) =>
      setGoldenSetBaseline(setId, runId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qualityQueryKeys.goldenSets() });
      await queryClient.invalidateQueries({ queryKey: qualityQueryKeys.runs() });
    },
  });
}
