import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { FeedbackKind } from "../model/schemas";
import { sendMomentFeedback } from "./searchApi";

// 결과(momentId)·종류마다 한 번만 보낸다(SPEC-033 R-11). 앱의 QueryClient마다 메모리에만 기억한다(로그아웃·새로고침이면 사라진다).
const sentByClient = new WeakMap<QueryClient, Set<string>>();

function sentSet(client: QueryClient): Set<string> {
  const existing = sentByClient.get(client);
  if (existing !== undefined) {
    return existing;
  }
  const created = new Set<string>();
  sentByClient.set(client, created);
  return created;
}

export interface MomentFeedback {
  /** 기록을 보낸다. 같은 결과·종류를 이미 보냈으면 보내지 않고 false를 돌려준다. */
  send: (momentId: string, kind: FeedbackKind, playedMs?: number) => boolean;
  hasSent: (momentId: string, kind: FeedbackKind) => boolean;
}

/**
 * 이동·재생·맞음·틀림 기록(sendMomentFeedback). 질의 로그와 사전 보강에 쓰는 기록이라
 * 실패해도 화면 동작을 막지 않고 표시는 유지한다.
 */
export function useMomentFeedback(): MomentFeedback {
  const client = useQueryClient();
  const sent = sentSet(client);
  const key = (momentId: string, kind: FeedbackKind) => `${momentId}:${kind}`;
  return {
    send: (momentId, kind, playedMs) => {
      if (sent.has(key(momentId, kind))) {
        return false;
      }
      sent.add(key(momentId, kind));
      sendMomentFeedback(momentId, playedMs === undefined ? { kind } : { kind, playedMs }).catch(
        () => undefined,
      );
      return true;
    },
    hasSent: (momentId, kind) => sent.has(key(momentId, kind)),
  };
}
