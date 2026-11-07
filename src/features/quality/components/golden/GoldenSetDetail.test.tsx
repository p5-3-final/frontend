import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { problem } from "../../../../../mocks/handlers";
import { GOLDEN_SET_ID, QUALITY_API } from "../../../../../mocks/quality";
import { renderQuality } from "../../../../../tests/quality";

const PATH = `/quality/golden-sets/${GOLDEN_SET_ID}`;

describe("GoldenSetDetail", () => {
  it("[SPEC-035 R-10] 초안 항목과 확정 버전(버전·항목 수·매니페스트 경로·확정 시각·확정한 사람)을 보인다", async () => {
    renderQuality(PATH);

    expect(await screen.findByRole("heading", { name: "ppe-eval" })).toBeVisible();
    const drafts = await screen.findByRole("table", { name: "초안 항목" });
    expect(within(drafts).getAllByRole("row")).toHaveLength(2);
    expect(drafts).toHaveTextContent("틀림");
    const versions = await screen.findByRole("table", { name: "확정 버전" });
    const row = within(versions).getAllByRole("row")[1];
    expect(row).toHaveTextContent("v3");
    expect(row).toHaveTextContent("13");
    expect(row).toHaveTextContent(`golden/${GOLDEN_SET_ID}/v3/manifest.json`);
    expect(row).toHaveTextContent("나");
  });

  it("[SPEC-035 R-10] 초안 항목을 빼면 목록에서 사라진다", async () => {
    const { user } = renderQuality(PATH);
    const drafts = await screen.findByRole("table", { name: "초안 항목" });

    await user.click(within(drafts).getByRole("button", { name: "빼기" }));

    expect(await screen.findByText("초안 항목이 없습니다.")).toBeVisible();
  });

  it("[SPEC-035 R-10] 버전 확정은 확인 창 뒤에 요청하고 새 버전 번호와 매니페스트 경로를 보이며 초안이 0이 된다", async () => {
    const { user } = renderQuality(PATH);
    await screen.findByRole("table", { name: "초안 항목" });

    await user.click(screen.getByRole("button", { name: "버전 확정" }));
    const dialog = screen.getByRole("dialog", { name: "버전 확정" });
    expect(dialog).toHaveTextContent("초안 항목 1개");
    await user.click(within(dialog).getByRole("button", { name: "확정" }));

    expect(
      await screen.findByText(
        `v4를 확정했습니다. 매니페스트: golden/${GOLDEN_SET_ID}/v4/manifest.json`,
      ),
    ).toBeVisible();
    expect(await screen.findByText("초안 항목이 없습니다.")).toBeVisible();
    expect(screen.getByText("초안 0개")).toBeVisible();
  });

  it.each([
    ["QUALITY_GOLDEN_EMPTY", "초안 항목이 없어 확정할 수 없습니다."],
    ["QUALITY_GOLDEN_FREEZE_IN_PROGRESS", "다른 확정이 진행 중입니다. 잠시 후 다시 시도해 주세요."],
  ])("[SPEC-035 R-10] 확정이 409 %s이면 이유를 보인다", async (code, message) => {
    const { user } = renderQuality(PATH, {
      extra: [http.post(`${QUALITY_API}/golden-sets/:setId/versions`, () => problem(409, code))],
    });
    await screen.findByRole("table", { name: "초안 항목" });

    await user.click(screen.getByRole("button", { name: "버전 확정" }));
    const dialog = screen.getByRole("dialog", { name: "버전 확정" });
    await user.click(within(dialog).getByRole("button", { name: "확정" }));

    expect(await within(dialog).findByText(message)).toBeVisible();
  });
});
