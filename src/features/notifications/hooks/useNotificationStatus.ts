import { useSyncExternalStore } from "react";
import {
  getConnectionStatus,
  subscribeConnectionStatus,
  type ConnectionStatus,
} from "../model/notificationStream";

/** 알림 연결 상태(연결 중·열림·재연결 대기). 화면의 작은 연결 표시에 쓴다. */
export function useNotificationStatus(): ConnectionStatus {
  return useSyncExternalStore(subscribeConnectionStatus, getConnectionStatus);
}
