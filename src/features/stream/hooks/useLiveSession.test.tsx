import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionBody, STREAM_SESSION_ID, streamHandlers } from "../../../../mocks/stream";
import { recordRequests } from "../../../../tests/analysisDetail";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";
import { LIVE_POLL_MS, useLiveSession } from "./useLiveSession";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

let recorder: ReturnType<typeof recordRequests> | undefined;
afterEach(() => {
  recorder?.stop();
  vi.useRealTimers();
});

const count = (suffix: string) =>
  (recorder?.requests ?? []).filter((url) => url.pathname.endsWith(suffix)).length;

describe("useLiveSession", () => {
  it("[SPEC-031 R-19] LIVE 세션이면 상태·타임라인·알림을 stream API로 읽고 10초마다 다시 읽는다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    recorder = recordRequests();
    server.use(...streamHandlers());
    startSession("access-1");
    const { result } = renderHook(() => useLiveSession(STREAM_SESSION_ID), { wrapper });

    await waitFor(() => {
      expect(result.current.state?.sequence).toBe(16);
    });
    expect(result.current.isLive).toBe(true);
    expect(result.current.events).toHaveLength(1);
    expect(result.current.alerts).toHaveLength(1);
    expect(count("/state")).toBe(1);

    await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
    await waitFor(() => {
      expect(count("/state")).toBe(2);
    });
  });

  it("[SPEC-031 R-19] 세션이 닫히면 라이브 조회를 멈추고 isLive가 거짓이다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    recorder = recordRequests();
    let status: "LIVE" | "CLOSED" = "LIVE";
    server.use(...streamHandlers({ session: () => sessionBody({ status }) }));
    startSession("access-1");
    const { result } = renderHook(() => useLiveSession(STREAM_SESSION_ID), { wrapper });
    await waitFor(() => {
      expect(result.current.isLive).toBe(true);
    });

    status = "CLOSED";
    await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
    await waitFor(() => {
      expect(result.current.isLive).toBe(false);
    });
    const stateRequests = count("/state");
    await vi.advanceTimersByTimeAsync(LIVE_POLL_MS * 2);
    expect(count("/state")).toBe(stateRequests);
  });
});
