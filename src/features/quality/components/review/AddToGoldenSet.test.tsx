import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { problem } from "../../../../../mocks/handlers";
import {
  OPERATOR_ID,
  QUALITY_API,
  REVIEW_ITEM_ID,
  reviewItemBody,
  reviewLabelBody,
} from "../../../../../mocks/quality";
import { renderQuality } from "../../../../../tests/quality";

const LABELED = reviewItemBody({
  status: "LABELED",
  assigneeId: OPERATOR_ID,
  label: reviewLabelBody(),
  labeledAt: "2026-11-06T10:05:00Z",
});
const PATH = `/quality/review/${REVIEW_ITEM_ID}`;

async function openPanel(extra: Parameters<typeof renderQuality>[1] = {}) {
  const view = renderQuality(PATH, { fixture: { reviewItems: [LABELED] }, ...extra });
  const panel = await screen.findByRole("region", { name: "Golden Set에 넣기" });
  await within(panel).findByRole("button", { name: "초안에 넣기" });
  return { ...view, panel };
}

describe("AddToGoldenSet", () => {
  it("[SPEC-035 R-9] 출처가 검토인 세트만 고를 수 있고 넣으면 초안에 들어갔다고 안내한다", async () => {
    const { user, panel } = await openPanel();

    const select = within(panel).getByLabelText("Golden Set");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["ppe-eval"]);
    await user.click(within(panel).getByRole("button", { name: "초안에 넣기" }));

    expect(await within(panel).findByText("ppe-eval 초안에 넣었습니다.")).toBeVisible();
  });

  it("[SPEC-035 R-9] 이미 들어 있으면(409) 이유를 보인다", async () => {
    const { user, panel } = await openPanel();

    await user.click(within(panel).getByRole("button", { name: "초안에 넣기" }));
    await within(panel).findByText("ppe-eval 초안에 넣었습니다.");
    await user.click(within(panel).getByRole("button", { name: "초안에 넣기" }));

    expect(
      await within(panel).findByText("이미 이 Golden Set 초안에 들어 있습니다."),
    ).toBeVisible();
  });

  it.each([
    ["QUALITY_REVIEW_NOT_LABELED", "라벨이 없거나 불확실 라벨이라 넣을 수 없습니다."],
    ["QUALITY_GOLDEN_ORIGIN_MISMATCH", "가져온 데이터셋의 Golden Set에는 넣을 수 없습니다."],
  ])("[SPEC-035 R-9] 409 %s이면 이유를 보인다", async (code, message) => {
    const { user, panel } = await openPanel({
      extra: [http.post(`${QUALITY_API}/golden-sets/:setId/entries`, () => problem(409, code))],
    });

    await user.click(within(panel).getByRole("button", { name: "초안에 넣기" }));

    expect(await within(panel).findByText(message)).toBeVisible();
  });

  it("[SPEC-035 R-9] 라벨되지 않은 항목에는 넣기를 보이지 않는다", async () => {
    renderQuality(PATH, {
      fixture: { reviewItems: [reviewItemBody({ status: "ASSIGNED", assigneeId: OPERATOR_ID })] },
    });

    await screen.findByRole("form", { name: "라벨" });
    expect(screen.queryByRole("region", { name: "Golden Set에 넣기" })).not.toBeInTheDocument();
  });
});
