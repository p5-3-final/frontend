import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { recordRequests } from "../../../../../tests/analysisDetail";
import { renderQuality } from "../../../../../tests/quality";

async function openTrend() {
  const view = renderQuality("/quality/stages");
  const form = await screen.findByRole("form", { name: "단계 추이" });
  const { user } = view;
  await user.selectOptions(within(form).getByLabelText("단계"), "analyzer.judge");
  await user.clear(within(form).getByLabelText("시작일"));
  await user.type(within(form).getByLabelText("시작일"), "2026-11-01");
  await user.clear(within(form).getByLabelText("종료일"));
  await user.type(within(form).getByLabelText("종료일"), "2026-11-06");
  return { ...view, form };
}

describe("StageTrend", () => {
  it("[SPEC-035 R-15] 단계·기간·버전 키·값으로 조회하면 날짜별 p50·p95 선 그래프와 표를 보인다", async () => {
    const recorder = recordRequests();
    const { user, form } = await openTrend();
    await user.selectOptions(within(form).getByLabelText("버전 키"), "modelId");
    await user.type(within(form).getByLabelText("버전 값"), "gpt-6.1-terra");
    await user.click(within(form).getByRole("button", { name: "조회" }));

    expect(
      await screen.findByRole("img", { name: "analyzer.judge 날짜별 p50·p95 추이, 2일" }),
    ).toBeVisible();
    expect(screen.getByText("p50")).toBeVisible();
    expect(screen.getByText("p95")).toBeVisible();
    const table = screen.getByRole("table", { name: "단계 추이 값" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveTextContent("2026-11-06");
    expect(rows[1]).toHaveTextContent("2,900");
    expect(rows[1]).toHaveTextContent("3,500");
    const request = recorder.requests.find(
      (url) => url.pathname === "/api/v1/quality/stage-reports/trends",
    );
    expect(request?.searchParams.get("versionKey")).toBe("modelId");
    expect(request?.searchParams.get("versionValue")).toBe("gpt-6.1-terra");
    expect(request?.searchParams.get("from")).toBe("2026-11-01");
    recorder.stop();
  });

  it("[SPEC-035 R-15] 기간이 90일을 넘으면 요청하지 않고 이유를 보인다", async () => {
    const recorder = recordRequests();
    const { user, form } = await openTrend();
    await user.clear(within(form).getByLabelText("시작일"));
    await user.type(within(form).getByLabelText("시작일"), "2026-01-01");
    await user.click(within(form).getByRole("button", { name: "조회" }));

    expect(await within(form).findByText("기간은 90일까지 조회할 수 있습니다.")).toBeVisible();
    expect(
      recorder.requests.some((url) => url.pathname === "/api/v1/quality/stage-reports/trends"),
    ).toBe(false);
    recorder.stop();
  });

  it("[SPEC-035 R-15] 버전 키를 고르고 값을 비우면 요청하지 않는다", async () => {
    const { user, form } = await openTrend();
    await user.selectOptions(within(form).getByLabelText("버전 키"), "modelId");
    await user.click(within(form).getByRole("button", { name: "조회" }));

    expect(await within(form).findByText("버전 값을 넣어 주세요.")).toBeVisible();
  });
});
