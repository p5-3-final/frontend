import { useMe } from "../api/useMe";
import type { User } from "../model/schemas";

export type Role = User["roles"][number];

/**
 * 내 정보의 역할에 `role`이 있는지. 내 정보를 받기 전에는 거짓이다.
 * 화면에서 버튼을 숨기는 용도이고, 권한은 서버가 다시 검사한다(예: analysis reviewEvent 403).
 */
export function useHasRole(role: Role): boolean {
  const { data } = useMe();
  return data?.roles.includes(role) ?? false;
}
