import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { analysisHandlers, eventSummaryBody } from "../../../../mocks/analysis";
import { recordRequests, renderAnalysisDetail } from "../../../../tests/analysisDetail";

const EVENTS = [
  eventSummaryBody({
    eventId: "0192f300-0000-5000-8000-000000000101",
    eventType: "ppe_missing",
    startMs: 95_000,
    severity: "medium",
    description: "크레인 하부에서 작업자가 안전모 없이 자재를 옮깁니다.\n두 번째 줄",
  }),
  eventSummaryBody({
    eventId: "0192f300-0000-5000-8000-000000000102",
    eventType: "fall",
    startMs: 130_000,
    seekMs: 128_000,
    severity: "high",
    description: "작업자가 넘어졌습니다.",
    thumbnailUrl: null,
  }),
];

let recorder: ReturnType<typeof recordRequests> | undefined;
afterEach(() => {
  recorder?.stop();
});

async function eventRows() {
  const list = await screen.findByRole("list", { name: "이벤트 목록" });
  return within(list).getAllByRole("listitem");
}

describe("EventList", () => {
  it("[SPEC-031 R-3] 이벤트를 시작 시각 순으로 유형·시각·severity·설명 첫 줄·썸네일과 함께 보인다", async () => {
    renderAnalysisDetail(analysisHandlers({ events: EVENTS }));

    const rows = await eventRows();
    expect(rows).toHaveLength(2);
    const first = within(rows[0] ?? document.body);
    expect(first.getByText("보호구 미착용")).toBeVisible();
    expect(first.getByText("01:35")).toBeVisible();
    expect(first.getByText("보통")).toBeVisible();
    expect(first.getByText("크레인 하부에서 작업자가 안전모 없이 자재를 옮깁니다.")).toBeVisible();
    expect(first.queryByText(/두 번째 줄/)).not.toBeInTheDocument();
    expect(first.getByRole("img", { name: "보호구 미착용 01:35 썸네일" })).toHaveAttribute(
      "loading",
      "lazy",
    );
    expect(within(rows[1] ?? document.body).getByText("쓰러짐")).toBeVisible();
  });

  it("[SPEC-031 R-3] severity를 고르면 그 값으로 서버에 다시 묻고 주소에 남긴다", async () => {
    recorder = recordRequests();
    const { user, router } = renderAnalysisDetail(analysisHandlers({ events: EVENTS }));
    await eventRows();

    await user.selectOptions(screen.getByLabelText("심각도"), "high");

    await waitFor(async () => {
      expect(await eventRows()).toHaveLength(1);
    });
    expect(router.state.location.search).toBe("?severity=high");
    const eventRequests = recorder.requests.filter((url) => url.pathname.endsWith("/events"));
    expect(eventRequests.at(-1)?.searchParams.get("severity")).toBe("high");
    expect(eventRequests.at(-1)?.searchParams.get("size")).toBe("100");
  });

  it("[SPEC-031 R-3] 주소의 거르기 값으로 처음부터 걸러 보이고 유형·판정·확인 상태도 고를 수 있다", async () => {
    const { user } = renderAnalysisDetail(analysisHandlers({ events: EVENTS }), {
      path: "/analysis/videos/0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f?type=fall",
    });

    expect(await eventRows()).toHaveLength(1);
    expect(screen.getByLabelText("유형")).toHaveValue("fall");
    await user.selectOptions(screen.getByLabelText("판정 상태"), "rejected");
    expect(await screen.findByText("조건에 맞는 이벤트가 없습니다.")).toBeVisible();
    expect(screen.getByLabelText("확인 상태")).toHaveValue("");
  });

  it("[SPEC-031 R-3] 다음 쪽이 있으면 더 보기로 이어 받는다", async () => {
    const many = Array.from({ length: 120 }, (_, i) =>
      eventSummaryBody({
        eventId: `0192f300-0000-5000-8000-${String(i).padStart(12, "0")}`,
        startMs: i * 1000,
      }),
    );
    const { user } = renderAnalysisDetail(analysisHandlers({ events: many }));
    expect(await eventRows()).toHaveLength(100);

    await user.click(screen.getByRole("button", { name: "이벤트 더 보기" }));

    await screen.findByText("01:59");
    expect(await eventRows()).toHaveLength(120);
    expect(screen.queryByRole("button", { name: "이벤트 더 보기" })).not.toBeInTheDocument();
  });
});
