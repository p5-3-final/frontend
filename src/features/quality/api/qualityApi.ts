import { apiRequest, apiRequestNoContent } from "../../../shared/api/client";
import type { ReviewQuery } from "../model/reviewQuery";
import {
  alertReportSchema,
  datasetImportPageSchema,
  datasetImportSchema,
  evaluationRunPageSchema,
  evaluationRunSchema,
  featureExportSchema,
  goldenSetEntryPageSchema,
  goldenSetEntrySchema,
  goldenSetPageSchema,
  goldenSetSchema,
  goldenSetVersionPageSchema,
  goldenSetVersionSchema,
  reviewItemPageSchema,
  reviewItemSchema,
  sourceStageReportSchema,
  stageTrendSchema,
  type CreateDatasetImportRequest,
  type CreateFeatureExportRequest,
  type CreateGoldenSetRequest,
  type ReviewLabel,
} from "../model/schemas";
import type { AlertQuery, TrendQuery } from "../model/trendQuery";

// 계약 quality-service.yaml 공개 API. api-gateway가 접근 토큰을 검증하고 X-User-Id·X-User-Roles를 붙인다.
const QUALITY = "/api/v1/quality";

export const REVIEW_PAGE_SIZE = 20;
/** "저장 후 다음"이 한 번에 받는 후보 수(plan 5절). 다른 운영자와 겹쳐도 목록을 다시 받지 않게 여러 개를 받는다. */
export const NEXT_CANDIDATE_SIZE = 5;
/** 계약 Size 최대값. Golden Set 고르기·이름 찾기는 한 쪽으로 받는다. */
export const MAX_PAGE_SIZE = 100;

export function listReviewItems(query: ReviewQuery, page: number, size = REVIEW_PAGE_SIZE) {
  return apiRequest(`${QUALITY}/review-items`, reviewItemPageSchema, {
    query: { ...query, page, size },
  });
}

export function getReviewItem(itemId: string) {
  return apiRequest(`${QUALITY}/review-items/${itemId}`, reviewItemSchema);
}

export function assignReviewItem(itemId: string) {
  return apiRequest(`${QUALITY}/review-items/${itemId}/assignment`, reviewItemSchema, {
    method: "POST",
  });
}

export function releaseReviewItem(itemId: string) {
  return apiRequestNoContent(`${QUALITY}/review-items/${itemId}/assignment`, {
    method: "DELETE",
  });
}

export function labelReviewItem(itemId: string, label: ReviewLabel) {
  return apiRequest(`${QUALITY}/review-items/${itemId}/label`, reviewItemSchema, {
    method: "PUT",
    body: label,
  });
}

export function listGoldenSets() {
  return apiRequest(`${QUALITY}/golden-sets`, goldenSetPageSchema, {
    query: { page: 0, size: MAX_PAGE_SIZE },
  });
}

export function createGoldenSet(request: CreateGoldenSetRequest) {
  return apiRequest(`${QUALITY}/golden-sets`, goldenSetSchema, { method: "POST", body: request });
}

export function getGoldenSet(setId: string) {
  return apiRequest(`${QUALITY}/golden-sets/${setId}`, goldenSetSchema);
}

export function listGoldenSetEntries(setId: string) {
  return apiRequest(`${QUALITY}/golden-sets/${setId}/entries`, goldenSetEntryPageSchema, {
    query: { page: 0, size: MAX_PAGE_SIZE },
  });
}

export function addGoldenSetEntry(setId: string, reviewItemId: string) {
  return apiRequest(`${QUALITY}/golden-sets/${setId}/entries`, goldenSetEntrySchema, {
    method: "POST",
    body: { reviewItemId },
  });
}

export function deleteGoldenSetEntry(setId: string, entryId: string) {
  return apiRequestNoContent(`${QUALITY}/golden-sets/${setId}/entries/${entryId}`, {
    method: "DELETE",
  });
}

export function listGoldenSetVersions(setId: string) {
  return apiRequest(`${QUALITY}/golden-sets/${setId}/versions`, goldenSetVersionPageSchema, {
    query: { page: 0, size: MAX_PAGE_SIZE },
  });
}

export function createGoldenSetVersion(setId: string) {
  return apiRequest(`${QUALITY}/golden-sets/${setId}/versions`, goldenSetVersionSchema, {
    method: "POST",
  });
}

export function setGoldenSetBaseline(setId: string, runId: string) {
  return apiRequest(`${QUALITY}/golden-sets/${setId}/baseline`, goldenSetSchema, {
    method: "PUT",
    body: { runId },
  });
}

export function listEvaluationRuns(goldenSetId: string | undefined, page: number) {
  return apiRequest(`${QUALITY}/evaluation-runs`, evaluationRunPageSchema, {
    query: { goldenSetId, page, size: REVIEW_PAGE_SIZE },
  });
}

export function getEvaluationRun(runId: string) {
  return apiRequest(`${QUALITY}/evaluation-runs/${runId}`, evaluationRunSchema);
}

export function getSourceStageReport(sourceId: string) {
  return apiRequest(`${QUALITY}/stage-reports/sources/${sourceId}`, sourceStageReportSchema);
}

export function getStageTrend(query: TrendQuery) {
  return apiRequest(`${QUALITY}/stage-reports/trends`, stageTrendSchema, { query: { ...query } });
}

export function getAlertReport(query: AlertQuery) {
  return apiRequest(`${QUALITY}/alert-reports`, alertReportSchema, { query: { ...query } });
}

export function listDatasetImports(page: number) {
  return apiRequest(`${QUALITY}/dataset-imports`, datasetImportPageSchema, {
    query: { page, size: REVIEW_PAGE_SIZE },
  });
}

export function createDatasetImport(request: CreateDatasetImportRequest) {
  return apiRequest(`${QUALITY}/dataset-imports`, datasetImportSchema, {
    method: "POST",
    body: request,
  });
}

export function getDatasetImport(importId: string) {
  return apiRequest(`${QUALITY}/dataset-imports/${importId}`, datasetImportSchema);
}

export function createFeatureExport(request: CreateFeatureExportRequest) {
  return apiRequest(`${QUALITY}/feature-exports`, featureExportSchema, {
    method: "POST",
    body: request,
  });
}

export function getFeatureExport(exportId: string) {
  return apiRequest(`${QUALITY}/feature-exports/${exportId}`, featureExportSchema);
}
