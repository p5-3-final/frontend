import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handlers } from "../../../../mocks/handlers";
import { sseServer, stateUpdatedBody } from "../../../../mocks/notifications";
import { sessionStateBody, STREAM_SESSION_ID, streamHandlers } from "../../../../mocks/stream";
import { recordRequests } from "../../../../tests/analysisDetail";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

let recorder: ReturnType<typeof recordRequests> | undefined;
afterEach(() => {
  recorder?.stop();
});
const stateRequests = () =>
  (recorder?.requests ?? []).filter((url) => url.pathname.endsWith("/state")).length;

async function setUp() {
  recorder = recordRequests();
  const sse = sseServer();
  let sequence = 16;
  server.use(
    ...sse.handlers,
    handlers.me(),
    ...streamHandlers({ state: () => sessionStateBody({ sequence }) }),
  );
  startSession("access-1");
  renderRoute(`/stream/sessions/${STREAM_SESSION_ID}`);
  const panel = await screen.findByRole("region", { name: "현재 위험" });
  await within(panel).findByText("쓰러진 작업자");
  await vi.waitFor(() => {
    expect(sse.connections).toHaveLength(1);
  });
  return {
    panel,
    connection: sse.connections[0],
    setSequence: (next: number) => {
      sequence = next;
    },
  };
}

describe("LiveRiskPanel", () => {
  it("[SPEC-031 R-21] 더 큰 sequence의 state.updated를 받으면 개수를 바로 보이고 상태를 다시 읽는다", async () => {
    const { panel, connection } = await setUp();
    const before = stateRequests();

    // 다시 읽은 상태가 아직 16이면(stream-service 반영 전) 알림의 개수를 계속 보인다.
    connection?.send(
      {
        ...stateUpdatedBody(STREAM_SESSION_ID, 17),
        data: { ...stateUpdatedBody(STREAM_SESSION_ID, 17).data, activeRisks: 2, newRisks: 1 },
      },
      "1",
    );

    expect(await within(panel).findByText("활성 위험 2건 · 새 위험 1건 · 해소 0건")).toBeVisible();
    await waitFor(() => {
      expect(stateRequests()).toBe(before + 1);
    });
  });

  it("[SPEC-031 R-21] 반영한 것보다 작거나 같은 sequence는 버린다", async () => {
    const { panel, connection } = await setUp();
    const before = stateRequests();

    connection?.send(stateUpdatedBody(STREAM_SESSION_ID, 15), "1");
    connection?.send(stateUpdatedBody(STREAM_SESSION_ID, 16), "2");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(within(panel).queryByText(/새 위험/)).not.toBeInTheDocument();
    expect(stateRequests()).toBe(before);
  });

  it("[SPEC-031 R-21] 다시 읽은 상태가 그 sequence를 반영하면 상태 응답을 보인다", async () => {
    const { panel, connection, setSequence } = await setUp();

    setSequence(17);
    connection?.send(stateUpdatedBody(STREAM_SESSION_ID, 17), "1");

    await waitFor(() => {
      expect(stateRequests()).toBeGreaterThanOrEqual(2);
    });
    await waitFor(() => {
      expect(within(panel).queryByText(/새 위험/)).not.toBeInTheDocument();
    });
    expect(within(panel).getByText("쓰러진 작업자")).toBeVisible();
  });
});
