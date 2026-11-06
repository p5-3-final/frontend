import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { analysisHandlers, eventSummaryBody } from "../../../../mocks/analysis";
import { handlers } from "../../../../mocks/handlers";
import { recordRequests } from "../../../../tests/analysisDetail";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

let recorder: ReturnType<typeof recordRequests> | undefined;
afterEach(() => {
  recorder?.stop();
});

function eventsServer(events = [eventSummaryBody()]) {
  recorder = recordRequests();
  server.use(handlers.me(), ...analysisHandlers({ events }));
  startSession("access-1");
  return recorder;
}

function myEventRequests() {
  return (recorder?.requests ?? []).filter((url) => url.pathname === "/api/v1/analysis/events");
}

async function rows() {
  const list = await screen.findByRole("list", { name: "전체 이벤트" });
  return within(list).getAllByRole("listitem");
}

describe("AllEventsList", () => {
  it("[SPEC-031 R-11] 이벤트 메뉴에 들어오면 내 영상 전체 이벤트를 20건씩 보인다", async () => {
    eventsServer([
      eventSummaryBody({ eventId: "0192f300-0000-5000-8000-000000000001", eventType: "fall" }),
      eventSummaryBody({ eventId: "0192f300-0000-5000-8000-000000000002" }),
    ]);
    renderRoute("/events");

    expect(await screen.findByRole("heading", { name: "이벤트" })).toBeVisible();
    expect(await rows()).toHaveLength(2);
    expect(myEventRequests()[0]?.searchParams.get("size")).toBe("20");
    expect(myEventRequests()[0]?.searchParams.get("page")).toBe("0");
  });

  it("[SPEC-031 R-11] severity·기간으로 거르면 그 값으로 서버에 묻고 주소에 남긴다", async () => {
    eventsServer();
    const { user, router } = renderRoute("/events");
    await rows();

    await user.selectOptions(screen.getByLabelText("심각도"), "high");
    await user.type(screen.getByLabelText("시작일"), "2026-11-01");
    await user.type(screen.getByLabelText("종료일"), "2026-11-06");

    await waitFor(() => {
      const last = myEventRequests().at(-1);
      expect(last?.searchParams.get("severity")).toBe("high");
      // 서울 자정 기준. 종료일은 그날 끝까지라 다음 날 자정을 상한(제외)으로 보낸다.
      expect(last?.searchParams.get("from")).toBe("2026-10-31T15:00:00.000Z");
      expect(last?.searchParams.get("to")).toBe("2026-11-06T15:00:00.000Z");
    });
    expect(router.state.location.search).toBe("?severity=high&from=2026-11-01&to=2026-11-06");
  });

  it("[SPEC-031 R-11] 다음 쪽으로 넘기면 page를 올려 묻는다", async () => {
    eventsServer(
      Array.from({ length: 25 }, (_, i) =>
        eventSummaryBody({ eventId: `0192f300-0000-5000-8000-${String(i).padStart(12, "0")}` }),
      ),
    );
    const { user, router } = renderRoute("/events");
    expect(await rows()).toHaveLength(20);

    await user.click(screen.getByRole("button", { name: "다음 쪽" }));

    await waitFor(async () => {
      expect(await rows()).toHaveLength(5);
    });
    expect(router.state.location.search).toBe("?page=1");
  });
});
