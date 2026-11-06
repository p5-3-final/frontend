import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { ANALYSIS_API, ANALYSIS_EVENT_ID, analysisHandlers } from "../../../../mocks/analysis";
import { problem } from "../../../../mocks/handlers";
import {
  ANALYSIS_DETAIL_PATH,
  recordRequests,
  renderAnalysisDetail,
} from "../../../../tests/analysisDetail";

const OPEN_PATH = `${ANALYSIS_DETAIL_PATH}?event=${ANALYSIS_EVENT_ID}`;

async function detailPanel() {
  const detail = await screen.findByRole("region", { name: "이벤트 상세" });
  await within(detail).findByText("안전관리자 확인 필요");
  return detail;
}

describe("EventReviewForm", () => {
  it("[SPEC-031 R-7] OPERATOR가 기각과 메모를 저장하면 목록과 상세가 기각으로 바뀐다", async () => {
    const recorder = recordRequests();
    const { user } = renderAnalysisDetail(analysisHandlers(), {
      path: OPEN_PATH,
      roles: ["USER", "OPERATOR"],
    });
    const detail = await detailPanel();
    const form = await within(detail).findByRole("form", { name: "이벤트 확인·기각" });

    await user.click(within(form).getByRole("radio", { name: "기각" }));
    await user.type(within(form).getByLabelText("메모"), "자재 그림자를 사람으로 봄");
    await user.click(within(form).getByRole("button", { name: "저장" }));

    expect(await within(detail).findByText("저장했습니다.")).toBeVisible();
    const list = screen.getByRole("list", { name: "이벤트 목록" });
    expect(await within(list).findByText("기각")).toBeVisible();
    expect(within(form).getByRole("radio", { name: "기각" })).toBeChecked();
    expect(
      recorder.requests.some((url) => url.pathname.endsWith(`/events/${ANALYSIS_EVENT_ID}/review`)),
    ).toBe(true);
    recorder.stop();
  });

  it("[SPEC-031 R-7] 메모가 500자를 넘으면 저장하지 않고 안내한다", async () => {
    const { user } = renderAnalysisDetail(analysisHandlers(), {
      path: OPEN_PATH,
      roles: ["OPERATOR"],
    });
    const detail = await detailPanel();
    const form = await within(detail).findByRole("form", { name: "이벤트 확인·기각" });

    await user.click(within(form).getByRole("radio", { name: "확인" }));
    await user.click(within(form).getByLabelText("메모"));
    await user.paste("가".repeat(501));
    await user.click(within(form).getByRole("button", { name: "저장" }));

    expect(await within(form).findByText("메모는 500자까지 쓸 수 있습니다.")).toBeVisible();
  });

  it("[SPEC-031 R-7] 서버가 403이면 권한이 없다고 안내한다", async () => {
    const { user } = renderAnalysisDetail(
      [
        http.put(`${ANALYSIS_API}/events/:eventId/review`, () =>
          problem(403, "ANALYSIS_FORBIDDEN"),
        ),
        ...analysisHandlers(),
      ],
      { path: OPEN_PATH, roles: ["OPERATOR"] },
    );
    const detail = await detailPanel();
    const form = await within(detail).findByRole("form", { name: "이벤트 확인·기각" });

    await user.click(within(form).getByRole("radio", { name: "확인" }));
    await user.click(within(form).getByRole("button", { name: "저장" }));

    expect(
      await within(form).findByText("운영자만 이벤트를 확인·기각할 수 있습니다."),
    ).toBeVisible();
  });

  it("[SPEC-031 R-7] USER에게는 확인·기각 버튼이 보이지 않는다", async () => {
    renderAnalysisDetail(analysisHandlers(), { path: OPEN_PATH, roles: ["USER"] });
    const detail = await detailPanel();
    expect(
      within(detail).queryByRole("form", { name: "이벤트 확인·기각" }),
    ).not.toBeInTheDocument();
    expect(within(detail).queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
  });
});
