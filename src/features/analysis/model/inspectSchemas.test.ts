import { describe, expect, it } from "vitest";
import {
  askAcceptedBody,
  inspectResultBody,
  overlayBody,
  questionResultBody,
  trackBody,
  zoneListBody,
} from "../../../../mocks/inspect";
import { contractExamples } from "../../../../tests/contracts";
import {
  askAcceptedSchema,
  inspectResultSchema,
  objectAnswerSchema,
  overlaySchema,
  questionResultSchema,
  trackAttributeSchema,
  trackSchema,
  zoneListSchema,
} from "./inspectSchemas";

describe("클릭 조회·구역 응답 스키마", () => {
  it("[SPEC-032 R-1] 계약 예시의 오버레이를 읽는다", () => {
    expect(overlaySchema.parse(overlayBody()).tracks[0]?.boxes).toHaveLength(1);
  });

  it("[SPEC-032 R-4] 계약 예시의 클릭 조회와 트랙을 읽는다", () => {
    expect(inspectResultSchema.parse(inspectResultBody()).track?.attributeStatus).toBe("REQUESTED");
    expect(trackSchema.parse(trackBody()).attributes?.helmet).toBe("not_worn");
  });

  it("[SPEC-032 R-7] 계약 예시의 질문 접수와 결과를 읽는다", () => {
    expect(askAcceptedSchema.parse(askAcceptedBody()).status).toBe("REQUESTED");
    expect(questionResultSchema.parse(questionResultBody()).answer?.answerable).toBe(true);
  });

  it("[SPEC-032 R-10] 계약 예시의 구역 목록을 읽는다", () => {
    expect(zoneListSchema.parse(zoneListBody()).items[0]?.polygon).toHaveLength(4);
  });

  it("[SPEC-032 R-4] 계약 events/_track-attribute.schema.json의 예시를 모두 읽는다", () => {
    const examples = contractExamples("events/_track-attribute.schema.json");
    expect(examples.length).toBeGreaterThan(0);
    for (const example of examples) {
      expect(trackAttributeSchema.safeParse(example).success).toBe(true);
    }
  });

  it("[SPEC-032 R-8] 계약 events/_object-answer.schema.json의 예시를 모두 읽는다", () => {
    const examples = contractExamples("events/_object-answer.schema.json");
    expect(examples.length).toBeGreaterThan(0);
    for (const example of examples) {
      expect(objectAnswerSchema.safeParse(example).success).toBe(true);
    }
  });
});
