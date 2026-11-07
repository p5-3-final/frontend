import { DEGRADED_MESSAGES } from "../../../shared/lib/messages";
import type { Degraded } from "./schemas";

/** 축소 응답이면 이유에 맞는 안내를, 아니면 undefined를 돌려준다(SPEC-033 R-4). 검색과 영상 질문이 함께 쓴다. */
export function degradedMessage(degraded: Degraded): string | undefined {
  return degraded === null ? undefined : DEGRADED_MESSAGES[degraded.reason];
}
