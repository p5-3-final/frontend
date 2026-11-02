import type { User } from "./schemas";

const ROLE_LABELS: Record<User["roles"][number], string> = {
  USER: "일반 사용자",
  OPERATOR: "운영자",
  ADMIN: "관리자",
};

/** 화면에 보여 줄 역할 이름. 여러 역할이면 쉼표로 잇는다. */
export function roleLabel(roles: User["roles"]): string {
  return roles.map((role) => ROLE_LABELS[role]).join(", ");
}
