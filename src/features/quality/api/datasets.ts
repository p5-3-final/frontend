import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { POLL_INTERVAL_MS, exportPollInterval, importsPollInterval } from "../model/polling";
import { qualityQueryKeys } from "../model/queryKeys";
import type { CreateDatasetImportRequest, CreateFeatureExportRequest } from "../model/schemas";
import {
  createDatasetImport,
  createFeatureExport,
  getDatasetImport,
  getFeatureExport,
  listDatasetImports,
} from "./qualityApi";

/** 가져오기 목록(listDatasetImports, SPEC-035 R-17). 진행 중인 항목이 있으면 5초마다 다시 받는다. */
export function useDatasetImports(page: number) {
  return useQuery({
    queryKey: qualityQueryKeys.importList(page),
    queryFn: () => listDatasetImports(page),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => importsPollInterval(query.state.data?.items),
  });
}

/** 가져오기 상세(getDatasetImport, R-18). 진행 중이면 5초마다 다시 받는다(R-17). */
export function useDatasetImport(importId: string) {
  return useQuery({
    queryKey: qualityQueryKeys.importItem(importId),
    queryFn: () => getDatasetImport(importId),
    refetchInterval: (query) =>
      importsPollInterval(query.state.data === undefined ? undefined : [query.state.data]),
  });
}

/** 가져오기 시작(createDatasetImport, R-16) */
export function useCreateDatasetImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateDatasetImportRequest) => createDatasetImport(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qualityQueryKeys.imports() }),
  });
}

/** 특징 내보내기 시작(createFeatureExport, R-19). 접수 응답으로 상태 캐시를 채워 바로 그린다. */
export function useCreateFeatureExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateFeatureExportRequest) => createFeatureExport(request),
    onSuccess: (created) => {
      queryClient.setQueryData(qualityQueryKeys.featureExport(created.exportId), created);
    },
  });
}

/** 내보내기 상태(getFeatureExport, R-17·R-19). 진행 중이면 5초마다 다시 받는다. */
export function useFeatureExport(exportId: string) {
  return useQuery({
    queryKey: qualityQueryKeys.featureExport(exportId),
    queryFn: () => getFeatureExport(exportId),
    // 접수 응답으로 채운 캐시는 방금 받은 값이라 다음 폴링까지 다시 받지 않는다.
    staleTime: POLL_INTERVAL_MS,
    refetchInterval: (query) => exportPollInterval(query.state.data),
  });
}
