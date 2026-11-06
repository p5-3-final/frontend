import type { Page } from "@playwright/test";
import type { NotificationBody } from "../../mocks/notifications";

const TICKET = "http://localhost:8080/api/v1/auth/sse-tickets";
const STREAM = "http://localhost:8080/api/v1/notify/stream";
// 보낼 메시지가 없을 때 연결을 붙잡아 두는 시간. 그동안 재연결 요청이 쌓이지 않는다.
const IDLE_HOLD_MS = 20_000;

/**
 * E2E용 가짜 알림 연결. page.route는 본문을 한 번에 주고 닫으므로, 연결마다 `push`로 쌓아 둔 메시지 묶음을 하나씩 준다.
 * 끊긴 뒤 1초 뒤 새 티켓으로 다시 연결하는 동작(SPEC-031 R-13)을 그대로 쓴다.
 */
export async function useFakeNotifications(page: Page) {
  const batches: NotificationBody[][] = [];
  const lastEventIds: (string | null)[] = [];
  let nextId = 0;
  let tickets = 0;
  let wake: (() => void) | undefined;

  await page.route(TICKET, async (route) => {
    tickets++;
    await route.fulfill({
      status: 201,
      json: { ticket: `ticket-${String(tickets)}`, expiresIn: 30 },
    });
  });

  await page.route(`${STREAM}**`, async (route) => {
    lastEventIds.push(await route.request().headerValue("last-event-id"));
    if (batches.length === 0) {
      // 보낼 메시지가 생길 때까지(또는 IDLE_HOLD_MS 동안) 연결을 열어 둔 것처럼 기다린다.
      await new Promise<void>((resolve) => {
        wake = resolve;
        setTimeout(resolve, IDLE_HOLD_MS);
      });
    }
    const batch = batches.shift();
    if (batch === undefined) {
      await route
        .fulfill({ status: 200, contentType: "text/event-stream", body: ": idle\n\n" })
        .catch(() => undefined);
      return;
    }
    const body = batch
      .map((message) => {
        nextId++;
        return `id: ${String(nextId)}\nevent: ${message.type}\ndata: ${JSON.stringify(message)}\n\n`;
      })
      .join("");
    await route.fulfill({ status: 200, contentType: "text/event-stream", body });
  });

  return {
    /** 다음 연결에 보낼 메시지 묶음을 쌓는다. */
    push: (...messages: NotificationBody[]) => {
      batches.push(messages);
      wake?.();
      wake = undefined;
    },
    lastEventIds,
  };
}
