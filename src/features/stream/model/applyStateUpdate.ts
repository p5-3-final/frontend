import type { NotificationOf } from "../../notifications";

/** state.updated가 알려 준 실시간 위험 개수(메시지는 개수 요약만 담는다) */
export interface LiveCounts {
  sequence: number;
  activeRisks: number;
  newRisks: number;
  resolvedRisks: number;
}

/**
 * state.updated를 sequence 순서대로 반영한다(SPEC-031 R-21). 이미 반영한 것(알림 또는 조회한 상태의 sequence)보다
 * 작거나 같으면 버리고 `current`를 그대로 돌려준다. 폴링 결과와 알림이 겹쳐도 한 번만 반영된다.
 */
export function applyStateUpdate(
  current: LiveCounts | null,
  baseSequence: number,
  message: NotificationOf<"state.updated">,
): LiveCounts | null {
  const applied = Math.max(baseSequence, current?.sequence ?? 0);
  if (message.data.sequence <= applied) {
    return current;
  }
  return {
    sequence: message.data.sequence,
    activeRisks: message.data.activeRisks,
    newRisks: message.data.newRisks,
    resolvedRisks: message.data.resolvedRisks,
  };
}
