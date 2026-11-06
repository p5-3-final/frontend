import { afterEach, describe, expect, it, vi } from "vitest";
import {
  jobStatusBody,
  pingBody,
  sseServer,
  type SseServer,
} from "../../../../mocks/notifications";
import { server } from "../../../../tests/server";
import { endSession, startSession } from "../../../shared/api/session";
import {
  getConnectionStatus,
  resetNotificationsForTest,
  startNotifications,
  subscribeNotifications,
} from "./notificationStream";
import type { NotificationMessage } from "./schemas";

const SOURCE_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";

function setUp(): { sse: SseServer; received: NotificationMessage[] } {
  const sse = sseServer();
  server.use(...sse.handlers);
  const received: NotificationMessage[] = [];
  subscribeNotifications((message) => received.push(message));
  return { sse, received };
}

async function connected(sse: SseServer, count = 1) {
  await vi.waitFor(() => {
    expect(sse.connections).toHaveLength(count);
  });
  return sse.connections[count - 1];
}

afterEach(() => {
  resetNotificationsForTest();
  vi.useRealTimers();
});

describe("notificationStream", () => {
  it("[SPEC-031 R-12] 로그인하면 접근 토큰으로 티켓을 받아 그 티켓으로 스트림에 연결한다", async () => {
    const { sse } = setUp();
    startNotifications();
    expect(sse.ticketRequests).toHaveLength(0);

    startSession("access-1");
    const connection = await connected(sse);

    expect(sse.ticketRequests[0]?.authorization).toBe("Bearer access-1");
    expect(connection?.ticket).toBe("ticket-1");
    // 계약 security: [] — 스트림 연결에는 접근 토큰을 붙이지 않는다.
    expect(connection?.authorization).toBeNull();
    await vi.waitFor(() => {
      expect(getConnectionStatus()).toBe("open");
    });
  });

  it("[SPEC-031 R-12] 받은 메시지를 구독자에게 전달하고 ping과 형식이 틀린 메시지는 버린다", async () => {
    const { sse, received } = setUp();
    startSession("access-1");
    startNotifications();
    const connection = await connected(sse);

    connection?.send(pingBody(), "1");
    connection?.sendRaw('event: job.status\ndata: {"type":"job.status"}\n\n');
    connection?.send(jobStatusBody(SOURCE_ID, { progressPercent: 55 }), "2");

    await vi.waitFor(() => {
      expect(received).toHaveLength(1);
    });
    expect(received[0]).toMatchObject({ type: "job.status", data: { progressPercent: 55 } });
  });

  it("[SPEC-031 R-12] replayBuffered로 구독하면 구독 전에 받은 최근 메시지를 먼저 받는다", async () => {
    const { sse, received } = setUp();
    startSession("access-1");
    startNotifications();
    const connection = await connected(sse);
    connection?.send(jobStatusBody(SOURCE_ID, { progressPercent: 10 }), "1");
    await vi.waitFor(() => {
      expect(received).toHaveLength(1);
    });

    const late: NotificationMessage[] = [];
    const plain: NotificationMessage[] = [];
    subscribeNotifications((message) => late.push(message), { replayBuffered: true });
    subscribeNotifications((message) => plain.push(message));

    expect(late).toHaveLength(1);
    expect(plain).toHaveLength(0);
  });

  it("[SPEC-031 R-12] 로그인 전에는 연결하지 않는다", async () => {
    const { sse } = setUp();
    startNotifications();
    endSession();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sse.ticketRequests).toHaveLength(0);
  });
});
