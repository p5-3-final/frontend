import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { handlers } from "../../../../mocks/handlers";
import { http, HttpResponse } from "msw";
import {
  SESSIONS_API,
  sessionHandlers,
  workSessionBody,
  WORK_SESSION_ID,
} from "../../../../mocks/media";
import { recordRequests } from "../../../../tests/analysisDetail";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

let recorder: ReturnType<typeof recordRequests> | undefined;
afterEach(() => {
  recorder?.stop();
});

function openHistory(sessions = [workSessionBody()]) {
  recorder = recordRequests();
  server.use(handlers.me(), ...sessionHandlers({ sessions }));
  startSession("access-1");
  return renderRoute("/history");
}

describe("SessionList", () => {
  it("[SPEC-034 R-1] 내 작업 세션을 이름·현장·구역·만든 시각과 함께 20개씩 보인다", async () => {
    openHistory();

    const list = await screen.findByRole("list", { name: "작업 세션" });
    const row = within(list).getAllByRole("listitem")[0];
    expect(row).toBeDefined();
    const cells = within(row ?? document.body);
    expect(cells.getByRole("link", { name: "3번 라인 방호벽 교체" })).toHaveAttribute(
      "href",
      `/history/sessions/${WORK_SESSION_ID}`,
    );
    expect(cells.getByText("평택 공장")).toBeVisible();
    expect(cells.getByText("3번 라인 프레스 앞")).toBeVisible();
    expect(cells.getByText("2026. 11. 6. 오후 6:00")).toBeVisible();
    const request = recorder?.requests.find((url) => url.pathname === "/api/v1/media/sessions");
    expect(request?.searchParams.get("size")).toBe("20");
    expect(request?.searchParams.get("page")).toBe("0");
  });

  it("[SPEC-034 R-1] 현장·구역이 없으면 빈 값 표시를 보인다", async () => {
    openHistory([workSessionBody({ site: null, area: null })]);

    const list = await screen.findByRole("list", { name: "작업 세션" });
    expect(within(list).getAllByText("-")).toHaveLength(2);
  });

  it("[SPEC-034 R-1] ?page=로 다음 쪽을 묻는다", async () => {
    recorder = recordRequests();
    server.use(handlers.me(), ...sessionHandlers());
    startSession("access-1");
    renderRoute("/history?page=1");

    await screen.findByRole("heading", { name: "분석 이력" });
    await screen.findByRole("navigation", { name: "쪽 이동" });
    const request = recorder.requests.find((url) => url.pathname === "/api/v1/media/sessions");
    expect(request?.searchParams.get("page")).toBe("1");
  });

  it("[SPEC-034 R-1] 세션이 없으면 안내와 세션 만들기를 보인다", async () => {
    openHistory([]);

    expect(await screen.findByText("작업 세션이 없습니다.")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "세션 만들기" }).length).toBeGreaterThan(0);
  });
});

describe("SessionList 오류", () => {
  it("[SPEC-034 R-12] 목록이 5xx면 다시 시도 버튼을 보인다", async () => {
    server.use(
      handlers.me(),
      http.get(SESSIONS_API, () => new HttpResponse(null, { status: 500 })),
    );
    startSession("access-1");
    renderRoute("/history");

    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeVisible();
  });
});
