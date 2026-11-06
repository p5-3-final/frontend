import { afterEach, describe, expect, it, vi } from "vitest";
import { jobStatusBody, sseServer } from "../../../../mocks/notifications";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";
import { resetNotificationsForTest, startNotifications } from "./notificationStream";

afterEach(() => {
  resetNotificationsForTest();
  localStorage.clear();
  sessionStorage.clear();
});

describe("알림 연결 비밀값", () => {
  it("[SPEC-031 NFR-3] SSE 티켓을 콘솔·localStorage·sessionStorage에 남기지 않는다", async () => {
    const sse = sseServer();
    server.use(...sse.handlers);
    const consoleCalls = (["log", "info", "warn", "error", "debug"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    startSession("access-1");
    startNotifications();
    await vi.waitFor(() => {
      expect(sse.connections).toHaveLength(1);
    });
    sse.connections[0]?.send(jobStatusBody("0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f"), "1");
    sse.connections[0]?.close();
    await vi.waitFor(() => {
      expect(sse.ticketRequests.length).toBeGreaterThanOrEqual(1);
    });

    const ticket = sse.connections[0]?.ticket ?? "";
    expect(ticket).not.toBe("");
    const stored = [
      ...Object.keys(localStorage).map((key) => `${key}=${localStorage.getItem(key) ?? ""}`),
      ...Object.keys(sessionStorage).map((key) => `${key}=${sessionStorage.getItem(key) ?? ""}`),
    ].join("\n");
    expect(stored).not.toContain(ticket);
    for (const spy of consoleCalls) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(ticket);
    }
  });
});
