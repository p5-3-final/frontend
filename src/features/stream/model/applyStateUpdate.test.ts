import { describe, expect, it } from "vitest";
import type { NotificationOf } from "../../notifications";
import { applyStateUpdate } from "./applyStateUpdate";

function update(sequence: number, activeRisks = 1): NotificationOf<"state.updated"> {
  return {
    type: "state.updated",
    sourceId: "0192fb00-0000-7000-8000-000000000010",
    occurredAt: "2026-11-06T10:05:10Z",
    data: {
      sequence,
      chunkId: "0192fb00-0000-5000-8000-000000000010",
      activeRisks,
      newRisks: 1,
      resolvedRisks: 0,
    },
  };
}

describe("applyStateUpdate", () => {
  it("[SPEC-031 R-21] 받은 상태보다 큰 sequence면 반영한다", () => {
    expect(applyStateUpdate(null, 16, update(17, 2))).toEqual({
      sequence: 17,
      activeRisks: 2,
      newRisks: 1,
      resolvedRisks: 0,
    });
  });

  it("[SPEC-031 R-21] 이미 반영한 것보다 작거나 같은 sequence는 버린다", () => {
    const current = applyStateUpdate(null, 16, update(18, 3));
    expect(applyStateUpdate(current, 16, update(17, 9))).toBe(current);
    expect(applyStateUpdate(current, 16, update(18, 9))).toBe(current);
  });

  it("[SPEC-031 R-21] 조회한 상태의 sequence보다 작거나 같으면 버린다", () => {
    expect(applyStateUpdate(null, 16, update(16))).toBeNull();
    expect(applyStateUpdate(null, 16, update(12))).toBeNull();
  });
});
