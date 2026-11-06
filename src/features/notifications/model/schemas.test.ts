import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { contractExamples, contractsDir } from "../../../../tests/contracts";
import { notificationMessageSchema } from "./schemas";

const SOURCE_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";

/** notification-service.yaml의 SSE 응답 예시에서 data 줄을 꺼낸다. */
function streamExampleData(): unknown[] {
  const text = readFileSync(resolve(contractsDir(), "openapi/notification-service.yaml"), "utf8");
  return [...text.matchAll(/data: (\{.*\})/g)].map((match): unknown =>
    JSON.parse(match[1] ?? "null"),
  );
}

describe("알림 메시지 스키마", () => {
  it("[SPEC-031 R-12] 계약 notification-message.schema.json의 예시를 모두 읽는다", () => {
    const examples = contractExamples("notifications/v1/notification-message.schema.json");
    expect(examples.length).toBeGreaterThan(0);
    for (const example of examples) {
      expect(notificationMessageSchema.safeParse(example).success).toBe(true);
    }
  });

  it("[SPEC-031 R-12] 계약 notification-service.yaml의 SSE 예시 data를 읽는다", () => {
    const examples = streamExampleData();
    expect(examples.length).toBeGreaterThan(0);
    for (const example of examples) {
      expect(notificationMessageSchema.safeParse(example).success).toBe(true);
    }
  });

  it("[SPEC-031 R-16] source.completed와 ping을 읽는다", () => {
    const completed = notificationMessageSchema.parse({
      type: "source.completed",
      sourceId: SOURCE_ID,
      occurredAt: "2026-11-06T10:05:00Z",
      data: {
        jobId: "0192f0d5-0000-7000-8000-000000000001",
        summaryStatus: "generated",
        confirmedEvents: 2,
        activeRisksAtEnd: 1,
      },
    });
    expect(completed.type).toBe("source.completed");
    expect(
      notificationMessageSchema.safeParse({
        type: "ping",
        sourceId: null,
        occurredAt: "2026-11-06T10:05:00Z",
        data: {},
      }).success,
    ).toBe(true);
  });

  it("[SPEC-031 R-12] type과 data 형식이 맞지 않으면 거절한다", () => {
    expect(
      notificationMessageSchema.safeParse({
        type: "job.status",
        sourceId: SOURCE_ID,
        occurredAt: "2026-11-06T10:05:00Z",
        data: { requestId: "x" },
      }).success,
    ).toBe(false);
  });

  it("[SPEC-031 R-20] alert.raised를 읽고 other 유형은 거절한다", () => {
    const message = {
      type: "alert.raised",
      sourceId: "0192fb00-0000-7000-8000-000000000010",
      occurredAt: "2026-11-06T10:05:04Z",
      data: {
        candidateId: "0192fb00-0000-5000-8000-0000000000c1",
        status: "pending",
        eventType: "fall",
        severity: "high",
        cameraId: "0192fb00-0000-7000-8000-000000000020",
        description: null,
      },
    };
    expect(notificationMessageSchema.safeParse(message).success).toBe(true);
    expect(
      notificationMessageSchema.safeParse({
        ...message,
        data: { ...message.data, eventType: "other" },
      }).success,
    ).toBe(false);
  });

  it("[SPEC-031 R-21] state.updated를 읽는다", () => {
    const parsed = notificationMessageSchema.safeParse({
      type: "state.updated",
      sourceId: "0192fb00-0000-7000-8000-000000000010",
      occurredAt: "2026-11-06T10:05:10Z",
      data: {
        sequence: 17,
        chunkId: "0192fb00-0000-5000-8000-000000000010",
        activeRisks: 1,
        newRisks: 0,
        resolvedRisks: 0,
      },
    });
    expect(parsed.success).toBe(true);
  });
});
