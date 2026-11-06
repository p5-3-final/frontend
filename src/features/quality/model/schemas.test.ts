import { describe, expect, it } from "vitest";
import {
  alertReportBody,
  datasetImportBody,
  evaluationRunBody,
  featureExportBody,
  goldenSetBody,
  goldenSetEntryBody,
  goldenSetVersionBody,
  pageBody,
  reviewItemBody,
  sourceStageReportBody,
  stageTrendBody,
} from "../../../../mocks/quality";
import { vlmAnalysisSchema } from "../../analysis";
import {
  alertReportSchema,
  datasetImportSchema,
  evaluationRunPageSchema,
  featureExportSchema,
  goldenSetEntryPageSchema,
  goldenSetPageSchema,
  goldenSetVersionPageSchema,
  reviewItemPageSchema,
  sourceStageReportSchema,
  stageTrendSchema,
} from "./schemas";

describe("quality 응답 스키마", () => {
  it("계약 예시 응답을 모두 받아들인다", () => {
    expect(reviewItemPageSchema.parse(pageBody([reviewItemBody()])).items).toHaveLength(1);
    expect(goldenSetPageSchema.parse(pageBody([goldenSetBody()])).items[0]?.origin).toBe("review");
    expect(goldenSetEntryPageSchema.parse(pageBody([goldenSetEntryBody()])).items).toHaveLength(1);
    expect(goldenSetVersionPageSchema.parse(pageBody([goldenSetVersionBody()])).items).toHaveLength(
      1,
    );
    expect(
      evaluationRunPageSchema.parse(pageBody([evaluationRunBody()])).items[0]?.gate.passed,
    ).toBe(false);
    expect(sourceStageReportSchema.parse(sourceStageReportBody()).stages).toHaveLength(2);
    expect(stageTrendSchema.parse(stageTrendBody()).days).toHaveLength(2);
    expect(alertReportSchema.parse(alertReportBody()).days[0]?.dismissedCount).toBe(5);
    expect(datasetImportSchema.parse(datasetImportBody()).status).toBe("COMPLETED");
    expect(featureExportSchema.parse(featureExportBody()).rowCount).toBe(310);
  });

  it("검토 항목의 판정 결과는 analysis 2차 스키마로 읽는다", () => {
    const item = reviewItemPageSchema.parse(pageBody([reviewItemBody()])).items[0];
    expect(vlmAnalysisSchema.parse(item?.analysis).riskReason).toBe("안전모 미착용");
  });

  it("모르는 검토 사유도 받아들인다(열린 목록)", () => {
    const body = pageBody([reviewItemBody({ reason: "new_reason_v6" })]);
    expect(reviewItemPageSchema.parse(body).items[0]?.reason).toBe("new_reason_v6");
  });
});
