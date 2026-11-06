import { HttpResponse } from "msw";
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

/** 가짜 타이머를 쓰는 동안 fetch·스트림 처리(마이크로태스크·I/O)가 끝나기를 기다린다. */
async function settle(condition: () => boolean = () => false) {
  for (let i = 0; i < 100 && !condition(); i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

function useFakeTimeouts() {
  // setImmediate는 실제로 두어 MSW 응답 처리가 진행되게 한다.
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
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

  it("[SPEC-031 R-13] 연결하지 못하면 1·2·4·8·16·30·30초 기다린 뒤 새 티켓으로 다시 시도한다", async () => {
    useFakeTimeouts();
    const { sse } = setUp();
    sse.failTicketWith(() => new HttpResponse(null, { status: 503 }));
    startSession("access-1");
    startNotifications();
    await settle(() => sse.ticketRequests.length === 1);

    for (const [index, delay] of [1000, 2000, 4000, 8000, 16000, 30000, 30000].entries()) {
      await settle();
      await vi.advanceTimersByTimeAsync(delay - 1);
      expect(sse.ticketRequests).toHaveLength(index + 1);
      await vi.advanceTimersByTimeAsync(1);
      await settle(() => sse.ticketRequests.length === index + 2);
      expect(sse.ticketRequests).toHaveLength(index + 2);
    }
    expect(getConnectionStatus()).toBe("reconnecting");
  });

  it("[SPEC-031 R-13] 끊기면 마지막 이벤트 id를 Last-Event-ID로 보내고, 연결되면 대기를 1초로 되돌린다", async () => {
    useFakeTimeouts();
    const { sse, received } = setUp();
    sse.failTicketWith(() => new HttpResponse(null, { status: 503 }));
    startSession("access-1");
    startNotifications();
    await settle(() => sse.ticketRequests.length === 1);
    await vi.advanceTimersByTimeAsync(1000);
    await settle(() => sse.ticketRequests.length === 2);
    sse.failTicketWith(null);
    // 두 번 실패해 다음 대기는 2초다.
    await vi.advanceTimersByTimeAsync(2000);
    await settle(() => sse.connections.length === 1);
    const first = sse.connections[0];
    expect(first?.lastEventId).toBeNull();
    first?.send(jobStatusBody(SOURCE_ID), "1730887200000-0");
    await settle(() => received.length === 1);

    first?.close();
    await settle();
    await vi.advanceTimersByTimeAsync(1000);
    await settle(() => sse.connections.length === 2);

    expect(sse.connections[1]?.ticket).toBe("ticket-4");
    expect(sse.connections[1]?.lastEventId).toBe("1730887200000-0");
  });

  it("[SPEC-031 R-13] 45초 동안 아무것도 받지 못하면 끊긴 것으로 보고 다시 연결한다", async () => {
    useFakeTimeouts();
    const { sse } = setUp();
    startSession("access-1");
    startNotifications();
    await settle(() => sse.connections.length === 1);

    await vi.advanceTimersByTimeAsync(30_000);
    sse.connections[0]?.send(pingBody(), "1");
    await settle();
    await vi.advanceTimersByTimeAsync(44_999);
    await settle();
    expect(sse.connections).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1);
    await settle();
    await vi.advanceTimersByTimeAsync(1000);
    await settle(() => sse.connections.length === 2);
    expect(sse.connections).toHaveLength(2);
    expect(sse.connections[1]?.lastEventId).toBe("1");
  });
});
