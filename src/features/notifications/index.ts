export { useNotification, type UseNotificationOptions } from "./hooks/useNotification";
export { useNotificationStatus } from "./hooks/useNotificationStatus";
export {
  getConnectionStatus,
  startNotifications,
  subscribeNotifications,
  type ConnectionStatus,
} from "./model/notificationStream";
export type { NotificationMessage, NotificationOf, NotificationType } from "./model/schemas";
