import { screen, waitFor, within } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { analysisHandlers } from "../../../../mocks/analysis";
import { answerBody, SEARCH_API, SEARCH_SOURCE_ID, searchHandlers } from "../../../../mocks/search";
import { recordRequests, renderAnalysisDetail } from "../../../../tests/analysisDetail";

const QUESTION = "방호벽은 언제 치워졌나요?";

function renderPanel(extra: Parameters<typeof renderAnalysisDetail>[0] = []) {
  const recorder = recordRequests();
  const view = renderAnalysisDetail([...extra, ...searchHandlers(), ...analysisHandlers()]);
  return { ...view, ...recorder };
}

async function ask(user: ReturnType<typeof renderPanel>["user"]) {
  const panel = await screen.findByRole("region", { name: "영상에 질문" });
  await user.type(within(panel).getByRole("textbox", { name: "질문" }), QUESTION);
  await user.click(within(panel).getByRole("button", { name: "질문하기" }));
  return panel;
}

describe("VideoQuestionPanel", () => {
  it("[SPEC-033 R-9] 질문하면 답·판정 상태·근거 구간·관련 이벤트·한계를 보인다", async () => {
    const { user, requests, stop } = renderPanel();

    const panel = await ask(user);

    expect(
      await within(panel).findByText("1분 10초쯤 통로 입구의 방호벽이 옮겨졌습니다."),
    ).toBeVisible();
    expect(within(panel).getByText("확인됨")).toBeVisible();
    expect(within(panel).getByRole("button", { name: "근거 00:40–00:50로 이동" })).toBeVisible();
    expect(
      within(panel).getByRole("button", { name: "안전시설 이동 01:10 이벤트로 이동" }),
    ).toBeVisible();
    expect(within(panel).getByText("통로 입구의 방호벽이 옮겨졌습니다.")).toBeVisible();
    expect(within(panel).getByText("장면 외형 기준 근거")).toBeVisible();
    const asked = requests.filter((url) => url.pathname.endsWith("/answer"));
    expect(asked.map((url) => url.pathname)).toEqual([
      `/api/v1/search/sources/${SEARCH_SOURCE_ID}/answer`,
    ]);
    expect(asked[0]?.searchParams.get("q")).toBe(QUESTION);
    stop();
  });

  it("[SPEC-033 R-9] 근거나 관련 이벤트를 누르면 플레이어를 그 seekMs로 옮긴다", async () => {
    const { user, stop } = renderPanel();
    const video = await screen.findByLabelText<HTMLVideoElement>("crane.mp4 재생");
    const panel = await ask(user);

    await user.click(await within(panel).findByRole("button", { name: "근거 00:40–00:50로 이동" }));
    expect(video.currentTime).toBe(38);

    await user.click(
      within(panel).getByRole("button", { name: "안전시설 이동 01:10 이벤트로 이동" }),
    );
    expect(video.currentTime).toBe(68);
    stop();
  });

  it("[SPEC-033 R-9] 답을 기다리는 동안 같은 질문을 다시 보내지 않게 버튼을 막는다", async () => {
    const { user, stop } = renderPanel([
      http.get(`${SEARCH_API}/sources/:id/answer`, async () => {
        await delay(200);
        return HttpResponse.json(answerBody());
      }),
    ]);

    const panel = await ask(user);

    expect(within(panel).getByRole("button", { name: "답을 만드는 중" })).toBeDisabled();
    await within(panel).findByText("확인됨");
    stop();
  });

  it("[SPEC-033 R-9] 질문이 비어 있으면 묻지 않고 이유를 보인다", async () => {
    const { user, requests, stop } = renderPanel();
    const panel = await screen.findByRole("region", { name: "영상에 질문" });

    await user.click(within(panel).getByRole("button", { name: "질문하기" }));

    expect(await within(panel).findByText("질문을 1~200자로 입력해 주세요.")).toBeVisible();
    expect(requests.filter((url) => url.pathname.endsWith("/answer"))).toEqual([]);
    stop();
  });

  it("[SPEC-033 R-10] answer가 null이면 답을 만들지 못했다는 안내와 근거를 보인다", async () => {
    const { user, stop } = renderPanel([
      http.get(`${SEARCH_API}/sources/:id/answer`, () =>
        HttpResponse.json(
          answerBody({
            answer: null,
            status: "unverified",
            degraded: { reason: "ai_unavailable" },
          }),
        ),
      ),
    ]);

    const panel = await ask(user);

    expect(await within(panel).findByText("답을 만들지 못했고 근거만 보여 줍니다.")).toBeVisible();
    expect(
      within(panel).getByText("AI 기능을 쓸 수 없어 텍스트 검색 결과만 보여 줍니다."),
    ).toBeVisible();
    expect(within(panel).getByText("미확인")).toBeVisible();
    expect(within(panel).getByRole("button", { name: "근거 00:40–00:50로 이동" })).toBeVisible();
    stop();
  });

  it("[SPEC-033 R-13] 아직 검색 색인이 없으면 준비되지 않았다는 안내를 보인다", async () => {
    const { user, stop } = renderPanel([
      http.get(`${SEARCH_API}/sources/:id/answer`, () =>
        HttpResponse.json(
          { type: "about:blank", title: "Not Found", status: 404, code: "SEARCH_NOT_INDEXED" },
          { status: 404 },
        ),
      ),
    ]);

    const panel = await ask(user);

    await waitFor(() => {
      expect(within(panel).getByRole("alert")).toHaveTextContent(
        "아직 검색할 수 있게 준비되지 않았습니다.",
      );
    });
    stop();
  });
});
