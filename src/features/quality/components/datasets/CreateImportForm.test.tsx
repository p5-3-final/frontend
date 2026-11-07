import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { datasetImportBody } from "../../../../../mocks/quality";
import { recordRequests } from "../../../../../tests/analysisDetail";
import { renderQuality } from "../../../../../tests/quality";

async function openForm(extra: Parameters<typeof renderQuality>[1] = {}) {
  const view = renderQuality("/quality/datasets", extra);
  const form = await screen.findByRole("form", { name: "데이터셋 가져오기" });
  return { ...view, form };
}

describe("CreateImportForm", () => {
  it("[SPEC-035 R-16] 매니페스트 경로·평가 비율·분할 시드로 시작하면 목록에 대기로 나온다", async () => {
    const recorder = recordRequests();
    const { user, form } = await openForm();

    await user.type(
      within(form).getByLabelText("매니페스트 경로"),
      "imports/fall-2026/manifest.json",
    );
    await user.clear(within(form).getByLabelText("평가 비율(0~1)"));
    await user.type(within(form).getByLabelText("평가 비율(0~1)"), "0.3");
    await user.clear(within(form).getByLabelText("분할 시드"));
    await user.type(within(form).getByLabelText("분할 시드"), "7");
    await user.click(within(form).getByRole("button", { name: "가져오기 시작" }));

    const table = screen.getByRole("table", { name: "가져오기 목록" });
    const row = await within(table).findByRole("row", { name: /imports\/fall-2026/ });
    expect(row).toHaveTextContent("대기");
    expect(
      recorder.requests.some((url) => url.pathname === "/api/v1/quality/dataset-imports"),
    ).toBe(true);
    recorder.stop();
  });

  it("[SPEC-035 R-16] 경로 형식이 틀리거나 비율이 0~1 밖이면 요청하지 않고 이유를 보인다", async () => {
    const { user, form } = await openForm();

    await user.type(within(form).getByLabelText("매니페스트 경로"), "s3://bucket/manifest.json");
    await user.clear(within(form).getByLabelText("평가 비율(0~1)"));
    await user.type(within(form).getByLabelText("평가 비율(0~1)"), "1.5");
    await user.click(within(form).getByRole("button", { name: "가져오기 시작" }));

    expect(
      await within(form).findByText("imports/<폴더>/manifest.json 형식으로 넣어 주세요."),
    ).toBeVisible();
    expect(within(form).getByText("평가 비율은 0 이상 1 이하입니다.")).toBeVisible();
  });

  it("[SPEC-035 R-16] 같은 매니페스트를 가져오는 중이면(409) 안내한다", async () => {
    const { user, form } = await openForm({
      fixture: {
        imports: [
          datasetImportBody({
            manifestKey: "imports/fall-2026/manifest.json",
            status: "VALIDATING",
          }),
        ],
      },
    });

    await user.type(
      within(form).getByLabelText("매니페스트 경로"),
      "imports/fall-2026/manifest.json",
    );
    await user.click(within(form).getByRole("button", { name: "가져오기 시작" }));

    expect(await within(form).findByText("같은 매니페스트를 가져오는 중입니다.")).toBeVisible();
  });
});
