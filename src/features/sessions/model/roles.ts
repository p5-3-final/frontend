import { SESSION_ROLE_NAMES } from "../../../shared/lib/messages";

/** 세션 안 역할. 세션 상세의 칸과 업로드 고르기가 이 순서를 쓴다(SPEC-017, SPEC-034 R-3). */
export const SESSION_ROLES = ["BEFORE", "DURING", "AFTER"] as const;
export type SessionRole = (typeof SESSION_ROLES)[number];

/** 역할 칸 제목. 예: "작업 전 영상" */
export function sessionRoleName(role: SessionRole): string {
  return SESSION_ROLE_NAMES[role];
}

/** 업로드 화면 역할 고르기의 짧은 이름 */
export const SESSION_ROLE_LABELS: Readonly<Record<SessionRole, string>> = {
  BEFORE: "작업 전",
  DURING: "작업 중",
  AFTER: "작업 후",
};
