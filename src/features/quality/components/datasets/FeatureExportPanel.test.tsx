import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IMPORT_GOLDEN_SET_ID } from "../../../../../mocks/quality";
import { recordRequests } from "../../../../../tests/analysisDetail";
import { renderQuality } from "../../../../../tests/quality";

async function openPanel(advanceOnRead = false) {
  const view = renderQuality("/quality/datasets", { fixture: { advanceOnRead } });
  const form = await screen.findByRole("form", { name: "특징 내보내기" });
  await within(form).findByRole("option", { name: "physicalai-events-eval" });
  return { ...view, form };
}

describe("FeatureExportPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("[SPEC-035 R-19] Golden Set과 기간 중 하나만 입력할 수 있다", async () => {
    const { user, form } = await openPanel();

    expect(within(form).getByLabelText("Golden Set")).toBeEnabled();
    expect(within(form).getByLabelText("시작일")).toBeDisabled();
    await user.click(within(form).getByRole("radio", { name: "기간으로" }));

    expect(within(form).getByLabelText("Golden Set")).toBeDisabled();
    expect(within(form).getByLabelText("시작일")).toBeEnabled();
  });

  it("[SPEC-035 R-19] Golden Set으로 시작하면 그 값만 보내고, 끝나면 파일 경로·줄 수·영상 수를 보인다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const recorder = recordRequests();
    const { user, form } = await openPanel(true);

    await user.selectOptions(within(form).getByLabelText("Golden Set"), IMPORT_GOLDEN_SET_ID);
    await user.click(within(form).getByRole("button", { name: "내보내기 시작" }));

    const table = await screen.findByRole("table", { name: "최근 내보내기" });
    expect(await within(table).findByText("대기")).toBeVisible();
    await vi.advanceTimersByTimeAsync(5000);
    expect(await within(table).findByText("진행 중")).toBeVisible();
    await vi.advanceTimersByTimeAsync(5000);
    const row = within(table).getAllByRole("row")[1];
    expect(await within(table).findByText("완료")).toBeVisible();
    expect(row).toHaveTextContent(/exports\/.+\/features\.jsonl/);
    expect(row).toHaveTextContent("310");
    expect(row).toHaveTextContent("24");
    recorder.stop();
  });

  it("[SPEC-035 R-19] 기간이 90일을 넘으면 요청하지 않고 이유를 보인다", async () => {
    const recorder = recordRequests();
    const { user, form } = await openPanel();
    await user.click(within(form).getByRole("radio", { name: "기간으로" }));
    await user.clear(within(form).getByLabelText("시작일"));
    await user.type(within(form).getByLabelText("시작일"), "2026-01-01");
    await user.clear(within(form).getByLabelText("종료일"));
    await user.type(within(form).getByLabelText("종료일"), "2026-11-06");
    await user.click(within(form).getByRole("button", { name: "내보내기 시작" }));

    expect(await within(form).findByText("기간은 90일까지 조회할 수 있습니다.")).toBeVisible();
    expect(
      recorder.requests.some((url) => url.pathname === "/api/v1/quality/feature-exports"),
    ).toBe(false);
    recorder.stop();
  });
});
