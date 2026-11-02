import { useSyncExternalStore } from "react";
import { getSessionStatus, subscribeSession } from "../../../shared/api/session";

/** 로그인 상태(checking, authenticated, anonymous). 세션이 바뀌면 다시 그린다. */
export function useSessionStatus() {
  return useSyncExternalStore(subscribeSession, getSessionStatus);
}
