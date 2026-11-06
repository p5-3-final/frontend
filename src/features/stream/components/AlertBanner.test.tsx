import { act, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { handlers, mediaHandlers } from "../../../../mocks/handlers";
import { alertRaisedBody, sseServer } from "../../../../mocks/notifications";
import { STREAM_SESSION_ID, streamHandlers } from "../../../../mocks/stream";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";
import { emitNotificationForTest, type NotificationMessage } from "../../notifications";

const PENDING_ALERT: NotificationMessage = {
  type: "alert.raised",
  sourceId: STREAM_SESSION_ID,
  occurredAt: "2026-11-06T10:05:04Z",
  data: {
    candidateId: "0192fb00-0000-5000-8000-0000000000c1",
    status: "pending",
    eventType: "fall",
    severity: "high",
    cameraId: "0192fb00-0000-7000-8000-000000000020",
    description: null,
  },
};

// SPEC-031 R-20: 받은 뒤 2초 안에 보여야 한다.
const WITHIN_2S = { timeout: 2000 };

async function setUp() {
  const sse = sseServer();
  server.use(...sse.handlers, handlers.me(), ...mediaHandlers(), ...streamHandlers());
  startSession("access-1");
  const view = renderRoute("/analysis");
  await vi.waitFor(() => {
    expect(sse.connections).toHaveLength(1);
  });
  // 배너가 그려진 레이아웃(lazy 라우트)이 뜬 뒤에 보낸다. 그 전에 온 알림은 레이아웃이 없어 받을 화면이 없다.
  await screen.findByRole("heading", { name: "영상 분석" });
  return { ...view, connection: sse.connections[0] };
}

describe("AlertBanner", () => {
  it("[SPEC-031 R-20] alert.raised pending을 받으면 2초 안에 상단에 확인 중으로 보인다", async () => {
    await setUp();

    // 받은 시점부터 재려고 연결을 거치지 않고 메시지를 넘긴다(연결 경로는 아래 테스트가 확인한다).
    const startedAt = performance.now();
    act(() => {
      emitNotificationForTest(PENDING_ALERT);
    });

    const banner = await screen.findByRole("region", { name: "새 긴급 알림" }, WITHIN_2S);
    expect(performance.now() - startedAt).toBeLessThan(2000);
    expect(within(banner).getByText("확인 중")).toBeVisible();
    expect(within(banner).getByText("쓰러짐")).toBeVisible();
  });

  it("[SPEC-031 R-20] confirmed면 severity와 설명을, dismissed면 접힌 상태로 바꾼다", async () => {
    const { connection } = await setUp();
    connection?.send(alertRaisedBody(STREAM_SESSION_ID), "1");
    const banner = await screen.findByRole("region", { name: "새 긴급 알림" }, WITHIN_2S);

    connection?.send(
      alertRaisedBody(STREAM_SESSION_ID, {
        status: "confirmed",
        description: "작업자가 쓰러졌습니다.",
      }),
      "2",
    );
    expect(await within(banner).findByText("작업자가 쓰러졌습니다.")).toBeVisible();
    expect(within(banner).getByLabelText("심각도 높음")).toBeVisible();

    connection?.send(
      alertRaisedBody(STREAM_SESSION_ID, {
        candidateId: "0192fb00-0000-5000-8000-0000000000c2",
        status: "pending",
      }),
      "3",
    );
    connection?.send(
      alertRaisedBody(STREAM_SESSION_ID, {
        candidateId: "0192fb00-0000-5000-8000-0000000000c2",
        status: "dismissed",
        description: "그림자",
      }),
      "4",
    );
    expect(await within(banner).findByText("오탐으로 기각됨")).toBeVisible();
    expect(within(banner).queryByText("그림자")).not.toBeInTheDocument();
  });

  it("[SPEC-031 R-20] 알림을 누르면 그 세션 화면으로 가고 닫기로 지울 수 있다", async () => {
    const { connection, user, router } = await setUp();
    connection?.send(alertRaisedBody(STREAM_SESSION_ID), "1");
    const banner = await screen.findByRole("region", { name: "새 긴급 알림" }, WITHIN_2S);

    await user.click(within(banner).getByRole("link", { name: /쓰러짐/ }));
    // 화면 코드를 나눠 받아(lazy) 주소는 코드를 받은 뒤 바뀐다.
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/stream/sessions/${STREAM_SESSION_ID}`);
    });

    await user.click(within(banner).getByRole("button", { name: "쓰러짐 알림 닫기" }));
    expect(screen.queryByRole("region", { name: "새 긴급 알림" })).not.toBeInTheDocument();
  });
});
