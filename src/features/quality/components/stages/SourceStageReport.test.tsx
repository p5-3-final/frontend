import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STAGE_SOURCE_ID } from "../../../../../mocks/quality";
import { renderQuality } from "../../../../../tests/quality";

async function lookUp(sourceId: string) {
  const view = renderQuality("/quality/stages");
  const form = await screen.findByRole("form", { name: "영상별 단계 분해" });
  await view.user.type(within(form).getByLabelText("영상 ID"), sourceId);
  await view.user.click(within(form).getByRole("button", { name: "조회" }));
  return view;
}

describe("SourceStageReport", () => {
  it("[SPEC-035 R-14] 단계 경로별 개수·합계·p50·p95·오류 수를 합계 내림차순으로 보인다", async () => {
    await lookUp(STAGE_SOURCE_ID);

    const table = await screen.findByRole("table", { name: "단계 분해" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("event-analyzer.handle/analyzer.judge");
    expect(rows[0]).toHaveTextContent("9,121");
    expect(rows[0]).toHaveTextContent("2,950");
    expect(rows[0]).toHaveTextContent("3,400");
    expect(rows[1]).toHaveTextContent("normalize.handle/normalize.transcode");
  });

  it("[SPEC-035 R-14] 측정 기록이 없으면(404) 90일 보존 안내를 보인다", async () => {
    await lookUp("0192f0d2-0000-7000-8000-00000000dead");

    expect(await screen.findByText("측정 기록 없음(90일 보존)")).toBeVisible();
  });

  it("[SPEC-035 R-14] 영상 ID 형식이 아니면 요청하지 않고 안내한다", async () => {
    await lookUp("not-a-uuid");

    expect(await screen.findByText("영상 ID(UUID)를 넣어 주세요.")).toBeVisible();
    expect(screen.queryByRole("table", { name: "단계 분해" })).not.toBeInTheDocument();
  });
});
