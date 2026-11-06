import { describe, expect, it } from "vitest";
import {
  eventDetailBody,
  eventPageBody,
  notAnalyzedSummaryBody,
  riskListBody,
  riskBody,
  riskForecastBody,
  snapshotListBody,
  sourceSummaryBody,
} from "../../../../mocks/analysis";
import { contractExamples } from "../../../../tests/contracts";
import {
  eventDetailSchema,
  eventPageSchema,
  riskForecastSchema,
  riskListSchema,
  snapshotListSchema,
  sourceSummarySchema,
  vlmAnalysisSchema,
} from "./schemas";

describe("analysis 응답 스키마", () => {
  it("[SPEC-031 R-1] 계약 예시의 요약(READY·NOT_ANALYZED)을 읽는다", () => {
    expect(sourceSummarySchema.parse(sourceSummaryBody()).status).toBe("READY");
    expect(sourceSummarySchema.parse(notAnalyzedSummaryBody()).summary).toBeNull();
  });

  it("[SPEC-031 R-3] 계약 예시의 이벤트 목록을 읽는다", () => {
    expect(eventPageSchema.parse(eventPageBody()).items).toHaveLength(1);
  });

  it("[SPEC-031 R-5] 계약 예시의 이벤트 상세를 읽는다", () => {
    expect(eventDetailSchema.parse(eventDetailBody()).evidenceFrames).toHaveLength(1);
  });

  it("[SPEC-031 R-8] 계약 예시의 위험과 스냅샷을 읽는다", () => {
    expect(
      riskListSchema.parse(riskListBody([riskBody({ forecast: riskForecastBody() })])).items,
    ).toHaveLength(1);
    expect(snapshotListSchema.parse(snapshotListBody()).items).toHaveLength(1);
  });

  it("[SPEC-031 R-5] 계약 events/_vlm-analysis.schema.json의 예시를 모두 읽는다", () => {
    const examples = contractExamples("events/_vlm-analysis.schema.json");
    expect(examples.length).toBeGreaterThan(0);
    for (const example of examples) {
      expect(vlmAnalysisSchema.safeParse(example).success).toBe(true);
    }
  });

  it("[SPEC-031 R-9] 계약 events/_risk-forecast.schema.json의 예시를 모두 읽는다", () => {
    const examples = contractExamples("events/_risk-forecast.schema.json");
    expect(examples.length).toBeGreaterThan(0);
    for (const example of examples) {
      expect(riskForecastSchema.safeParse(example).success).toBe(true);
    }
  });
});
