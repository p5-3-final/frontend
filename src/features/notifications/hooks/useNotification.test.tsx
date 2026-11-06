import { render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { jobStatusBody, sourceCompletedBody, sseServer } from "../../../../mocks/notifications";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";
import { startNotifications } from "../model/notificationStream";
import { useNotification } from "./useNotification";

const SOURCE_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";
const OTHER_ID = "0192f0d2-0000-7000-8000-000000000999";

function Progress({ name, sourceId }: { name: string; sourceId: string }) {
  const [value, setValue] = useState("없음");
  useNotification(
    "job.status",
    (message) => {
      setValue(String(message.data.progressPercent));
    },
    { sourceId },
  );
  return <p>{`${name}: ${value}`}</p>;
}

function Screens({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Progress key={i} name={`화면${String(i + 1)}`} sourceId={SOURCE_ID} />
      ))}
    </>
  );
}

// 앱(AppProviders)처럼 화면을 그리기 전에 연결을 시작하고, StrictMode로 효과가 두 번 도는 상황까지 확인한다.
function renderScreens(count: number) {
  startNotifications();
  const tree = (n: number) => (
    <StrictMode>
      <Screens count={n} />
    </StrictMode>
  );
  const { rerender } = render(tree(count));
  return {
    rerender: (n: number) => {
      rerender(tree(n));
    },
  };
}

describe("useNotification", () => {
  it("[SPEC-031 NFR-2] 화면 세 개가 구독해도 연결 요청은 한 번이고 모두 메시지를 받는다", async () => {
    const sse = sseServer();
    server.use(...sse.handlers);
    startSession("access-1");
    renderScreens(3);
    await vi.waitFor(() => {
      expect(sse.connections).toHaveLength(1);
    });

    sse.connections[0]?.send(jobStatusBody(SOURCE_ID, { progressPercent: 70 }), "1");

    expect(await screen.findByText("화면1: 70")).toBeInTheDocument();
    expect(screen.getByText("화면2: 70")).toBeInTheDocument();
    expect(screen.getByText("화면3: 70")).toBeInTheDocument();
    expect(sse.ticketRequests).toHaveLength(1);
  });

  it("[SPEC-031 R-12] 다른 영상의 메시지와 다른 종류는 넘기지 않고, 구독을 끝내도 연결은 유지된다", async () => {
    const sse = sseServer();
    server.use(...sse.handlers);
    startSession("access-1");
    const { rerender } = renderScreens(2);
    await vi.waitFor(() => {
      expect(sse.connections).toHaveLength(1);
    });
    const connection = sse.connections[0];

    connection?.send(jobStatusBody(OTHER_ID, { progressPercent: 10 }), "1");
    connection?.send(sourceCompletedBody(SOURCE_ID), "2");
    rerender(1);
    connection?.send(jobStatusBody(SOURCE_ID, { progressPercent: 90 }), "3");

    expect(await screen.findByText("화면1: 90")).toBeInTheDocument();
    expect(screen.queryByText(/화면2/)).not.toBeInTheDocument();
    expect(sse.connections).toHaveLength(1);
    expect(sse.ticketRequests).toHaveLength(1);
  });
});
