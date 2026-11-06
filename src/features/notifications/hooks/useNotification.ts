import { useEffect, useEffectEvent } from "react";
import { subscribeNotifications } from "../model/notificationStream";
import type { NotificationMessage, NotificationOf, NotificationType } from "../model/schemas";

export interface UseNotificationOptions {
  /** 이 영상의 메시지만 받는다. */
  sourceId?: string;
  /** 구독 전에 받아 둔 최근 메시지도 먼저 받는다(SPEC-032·033 요청-알림 경합 대비). */
  replayBuffered?: boolean;
}

function isOneOf<T extends NotificationType>(
  message: NotificationMessage,
  types: readonly T[],
): message is NotificationOf<T> {
  return types.some((type) => type === message.type);
}

/**
 * 탭에 하나뿐인 알림 연결에서 고른 종류의 메시지를 받는다(SPEC-031 R-12).
 * 화면이 사라지면 구독만 끝나고 연결은 유지된다. handler는 최신 값을 쓰므로 매 렌더 새 함수여도 된다.
 */
export function useNotification<T extends NotificationType>(
  types: T | readonly T[],
  handler: (message: NotificationOf<T>) => void,
  options: UseNotificationOptions = {},
): void {
  const { sourceId, replayBuffered = false } = options;
  const typeKey = typeof types === "string" ? types : types.join(",");
  const onMessage = useEffectEvent((message: NotificationMessage) => {
    const list: readonly T[] = typeof types === "string" ? [types] : types;
    if (!isOneOf(message, list)) {
      return;
    }
    if (sourceId !== undefined && message.sourceId !== sourceId) {
      return;
    }
    handler(message);
  });
  useEffect(
    () =>
      subscribeNotifications(
        (message) => {
          onMessage(message);
        },
        { replayBuffered },
      ),
    // typeKey·sourceId가 바뀌면 다시 구독해 버퍼 재생 범위를 맞춘다.
    [typeKey, sourceId, replayBuffered],
  );
}
