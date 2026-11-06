export { useNotification, type UseNotificationOptions } from "./hooks/useNotification";
export { useNotificationStatus } from "./hooks/useNotificationStatus";
export {
  // 테스트 전용: 받은 시점부터 재는 검증(SPEC-031 R-20)에 쓴다.
  emitNotificationForTest,
  getConnectionStatus,
  startNotifications,
  subscribeNotifications,
  type ConnectionStatus,
} from "./model/notificationStream";
export type { NotificationMessage, NotificationOf, NotificationType } from "./model/schemas";
