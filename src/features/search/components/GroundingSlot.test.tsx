import { screen, within } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { sseServer } from "../../../../mocks/notifications";
import {
  groundingCompletedBody,
  momentList,
  momentSearchBody,
  SEARCH_API,
  SEARCH_SOURCE_ID,
} from "../../../../mocks/search";
import { renderSearch, searchPath } from "../../../../tests/searchScreen";

const SOURCE_PATH = searchPath({ q: "안전모", scope: "source", sourceId: SEARCH_SOURCE_ID });
// momentList: 상위 3개만 주석을 요청한 상태(REQUESTED)이고 나머지는 NONE이다.
const RESULTS = momentList(4);
const FIRST_GROUNDING = RESULTS[0]?.grounding.groundingId ?? "";
const SECOND_GROUNDING = RESULTS[1]?.grounding.groundingId ?? "";

async function setUp(extra: Parameters<typeof renderSearch>[1] = {}) {
  const sse = sseServer();
  const view = renderSearch(SOURCE_PATH, {
    fixture: { sourceSearch: momentSearchBody({ results: RESULTS }) },
    ...extra,
    extra: [...sse.handlers, ...(extra.extra ?? [])],
  });
  await vi.waitFor(() => {
    expect(sse.connections).toHaveLength(1);
  });
  return { ...view, connection: sse.connections[0] };
}

function resultItems() {
  return within(screen.getByRole("list", { name: "검색 결과" })).getAllByRole("listitem");
}

describe("GroundingSlot", () => {
  it("[SPEC-033 R-5] 주석을 요청한 결과는 만드는 중으로 보이고 NONE인 결과에는 주석 자리가 없다", async () => {
    const { stopRecording } = await setUp();

    await screen.findByRole("list", { name: "검색 결과" });
    const items = resultItems();
    expect(within(items[0] ?? document.body).getByText("주석 클립 만드는 중")).toBeVisible();
    expect(within(items[3] ?? document.body).queryByText(/주석/)).not.toBeInTheDocument();
    stopRecording();
  });

  it("[SPEC-033 R-5] READY 알림이 오면 클립 정보를 불러와 주석 클립 보기를 보인다", async () => {
    const { connection, requests, stopRecording } = await setUp();
    await screen.findByRole("list", { name: "검색 결과" });

    connection?.send(groundingCompletedBody(FIRST_GROUNDING, "READY"), "1");

    const items = resultItems();
    expect(
      await within(items[0] ?? document.body).findByRole("button", { name: "주석 클립 보기" }),
    ).toBeVisible();
    expect(
      requests.some((url) => url.pathname === `/api/v1/search/groundings/${FIRST_GROUNDING}`),
    ).toBe(true);
    // 다른 결과는 그대로다.
    expect(within(items[1] ?? document.body).getByText("주석 클립 만드는 중")).toBeVisible();
    stopRecording();
  });

  it("[SPEC-033 R-5] FAILED 알림이 오면 주석을 만들지 못함을 보인다", async () => {
    const { connection, stopRecording } = await setUp();
    await screen.findByRole("list", { name: "검색 결과" });

    connection?.send(groundingCompletedBody(SECOND_GROUNDING, "FAILED"), "1");

    expect(
      await within(resultItems()[1] ?? document.body).findByText("주석을 만들지 못했습니다."),
    ).toBeVisible();
    stopRecording();
  });

  it("[SPEC-033 R-5] 알림이 검색 응답보다 먼저 와도 반영한다", async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { connection, stopRecording } = await setUp({
      extra: [
        http.get(`${SEARCH_API}/sources/:id/moments`, async () => {
          await gate;
          await delay(10);
          return HttpResponse.json(momentSearchBody({ results: RESULTS }));
        }),
      ],
    });
    await screen.findByText("검색 중입니다.");

    connection?.send(groundingCompletedBody(FIRST_GROUNDING, "READY"), "1");
    release();

    await screen.findByRole("list", { name: "검색 결과" });
    expect(
      await within(resultItems()[0] ?? document.body).findByRole("button", {
        name: "주석 클립 보기",
      }),
    ).toBeVisible();
    stopRecording();
  });

  it("[SPEC-033 R-5] 응답 시점에 이미 READY인 결과는 바로 클립 정보를 불러온다", async () => {
    const ready = RESULTS.map((moment, index) =>
      index === 0
        ? { ...moment, grounding: { ...moment.grounding, status: "READY" as const } }
        : moment,
    );
    const { stopRecording } = await setUp({
      fixture: { sourceSearch: momentSearchBody({ results: ready }) },
    });

    await screen.findByRole("list", { name: "검색 결과" });
    expect(
      await within(resultItems()[0] ?? document.body).findByRole("button", {
        name: "주석 클립 보기",
      }),
    ).toBeVisible();
    stopRecording();
  });
});
