import { ApiError } from "../../../shared/api/problem";
import { messageForCode, SEARCH_FAILED_MESSAGE } from "../../../shared/lib/messages";

/**
 * 검색 오류를 화면에서 보일 자리로 나눈다(SPEC-033 R-13).
 * - input: 질의·이미지가 틀림(400). 입력 옆에 보인다.
 * - notice: 영상이 없거나 아직 색인이 없음(404). 다시 시도해도 같아 안내만 보인다.
 * - retry: 5xx·네트워크 오류. 다시 시도 버튼을 보인다.
 */
export type SearchErrorView =
  | { kind: "input"; message: string }
  | { kind: "notice"; message: string }
  | { kind: "retry"; message: string };

export function toSearchErrorView(error: unknown): SearchErrorView {
  if (error instanceof ApiError && error.status === 400) {
    return { kind: "input", message: messageForCode(error.code) };
  }
  if (error instanceof ApiError && error.status === 404) {
    return { kind: "notice", message: messageForCode(error.code) };
  }
  return { kind: "retry", message: SEARCH_FAILED_MESSAGE };
}
