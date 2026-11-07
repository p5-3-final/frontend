import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { alertReportBody } from "../../../../../mocks/quality";
import { http, HttpResponse } from "msw";
import { QUALITY_API } from "../../../../../mocks/quality";
import { renderQuality } from "../../../../../tests/quality";

async function lookUp(extra: Parameters<typeof renderQuality>[1] = {}) {
  const view = renderQuality("/quality/stages", extra);
  const form = await screen.findByRole("form", { name: "긴급 알림 지표" });
  await view.user.clear(within(form).getByLabelText("시작일"));
  await view.user.type(within(form).getByLabelText("시작일"), "2026-11-01");
  await view.user.clear(within(form).getByLabelText("종료일"));
  await view.user.type(within(form).getByLabelText("종료일"), "2026-11-06");
  await view.user.click(within(form).getByRole("button", { name: "조회" }));
  return view;
}

describe("AlertReportPanel", () => {
  it("[SPEC-035 R-22] 긴급 알림 지연 p50·p95와 dismissed 비율, 미해결 건수를 보인다", async () => {
    await lookUp();

    const table = await screen.findByRole("table", { name: "긴급 알림 일별 지표" });
    const row = within(table).getAllByRole("row")[1];
    expect(row).toHaveTextContent("2026-11-06");
    expect(row).toHaveTextContent("1,200");
    expect(row).toHaveTextContent("1,900");
    expect(row).toHaveTextContent("3,100");
    expect(row).toHaveTextContent("4,800");
    expect(row).toHaveTextContent("35.7%");
    const summary = screen.getByRole("list", { name: "기간 요약" });
    expect(summary).toHaveTextContent("기각 비율35.7%");
    expect(summary).toHaveTextContent("미해결0건");
  });

  it("[SPEC-035 R-22] 지연 값이 없거나 판정이 없는 날은 '-'로 보인다", async () => {
    await lookUp({
      extra: [
        http.get(`${QUALITY_API}/alert-reports`, () =>
          HttpResponse.json(
            alertReportBody({
              days: [
                {
                  date: "2026-11-02",
                  pendingCount: 3,
                  confirmedCount: 0,
                  dismissedCount: 0,
                  firstAlertP50Ms: null,
                  firstAlertP95Ms: null,
                  judgeP50Ms: null,
                  judgeP95Ms: null,
                },
              ],
            }),
          ),
        ),
      ],
    });

    const table = await screen.findByRole("table", { name: "긴급 알림 일별 지표" });
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("2026-11-02300-----");
    expect(screen.getByRole("list", { name: "기간 요약" })).toHaveTextContent("미해결3건");
  });
});
