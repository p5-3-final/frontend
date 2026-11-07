import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderQuality } from "../../../../../tests/quality";

async function openForm() {
  const view = renderQuality("/quality/golden-sets");
  const form = await screen.findByRole("form", { name: "Golden Set 만들기" });
  return { ...view, form };
}

describe("CreateGoldenSetForm", () => {
  it("[SPEC-035 R-8] 이름·분할·설명으로 만들면 목록에 나온다", async () => {
    const { user, form } = await openForm();

    await user.type(within(form).getByLabelText("이름"), "fall-dev");
    await user.selectOptions(within(form).getByLabelText("분할"), "dev");
    await user.type(within(form).getByLabelText("설명"), "쓰러짐 개발 세트");
    await user.click(within(form).getByRole("button", { name: "만들기" }));

    const table = screen.getByRole("table", { name: "Golden Set 목록" });
    expect(await within(table).findByRole("link", { name: "fall-dev" })).toBeVisible();
    expect(within(form).getByLabelText("이름")).toHaveValue("");
  });

  it("[SPEC-035 R-8] 이름이 소문자·숫자·하이픈 규칙에 맞지 않으면 요청하지 않고 이유를 보인다", async () => {
    const { user, form } = await openForm();

    await user.type(within(form).getByLabelText("이름"), "Fall_Set");
    await user.click(within(form).getByRole("button", { name: "만들기" }));

    expect(
      await within(form).findByText(
        "이름은 소문자·숫자로 시작하고 소문자·숫자·하이픈만 63자까지 쓸 수 있습니다.",
      ),
    ).toBeVisible();
  });

  it("[SPEC-035 R-8] 같은 이름이 있으면(409) 이름 옆에 안내한다", async () => {
    const { user, form } = await openForm();

    await user.type(within(form).getByLabelText("이름"), "ppe-eval");
    await user.click(within(form).getByRole("button", { name: "만들기" }));

    expect(await within(form).findByText("같은 이름의 Golden Set이 있습니다.")).toBeVisible();
  });
});
