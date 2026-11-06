import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { analysisHandlers, riskBody, riskForecastBody } from "../../../../mocks/analysis";
import { renderAnalysisDetail } from "../../../../tests/analysisDetail";

const ACTIVE = riskBody();
const RESOLVED = riskBody({
  riskId: "0192f500-0000-5000-8000-000000000005",
  zoneId: "global",
  zoneName: null,
  riskType: "barrier_not_restored",
  status: "resolved",
  reason: "방호벽 미복구",
  firstSeenMs: 30_000,
  resolvedAtMs: 80_000,
  carriedOver: true,
  exposure: { activeSeconds: 50, exposureCount: 3, exposureSeconds: 42.5 },
});

async function riskPanel() {
  return screen.findByRole("region", { name: "위험 상태" });
}

describe("RiskPanel", () => {
  it("[SPEC-031 R-8] 활성 위험을 먼저, 해소 위험을 다음에 구역·유형·사유·시각·노출과 함께 보인다", async () => {
    renderAnalysisDetail(analysisHandlers({ risks: [ACTIVE, RESOLVED] }));
    const panel = await riskPanel();

    const active = await within(panel).findByRole("list", { name: "활성 위험" });
    const resolved = within(panel).getByRole("list", { name: "해소된 위험" });
    expect(
      active.compareDocumentPosition(resolved) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const activeRow = within(active).getByRole("listitem");
    expect(within(activeRow).getByText("A동 크레인 하부")).toBeVisible();
    expect(within(activeRow).getByText("보호구 미착용")).toBeVisible();
    expect(within(activeRow).getByText("안전모 미착용")).toBeVisible();
    expect(within(activeRow).getByText("노출 1명 · 20초")).toBeVisible();
    expect(within(activeRow).getByText("해소 -")).toBeVisible();

    const resolvedRow = within(resolved).getByRole("listitem");
    expect(within(resolvedRow).getByText("전체")).toBeVisible();
    expect(within(resolvedRow).getByText("방호 미복구")).toBeVisible();
    expect(within(resolvedRow).getByText("해소 01:20")).toBeVisible();
    expect(within(resolvedRow).getByText("노출 3명 · 42.5초")).toBeVisible();
    expect(within(resolvedRow).getByText("이전 영상에서 이어짐")).toBeVisible();
  });

  it("[SPEC-031 R-8] 시작 시각을 누르면 플레이어가 그 시각으로 간다", async () => {
    const { user } = renderAnalysisDetail(analysisHandlers({ risks: [ACTIVE] }));
    const video = await screen.findByLabelText<HTMLVideoElement>("crane.mp4 재생");
    const panel = await riskPanel();

    await user.click(await within(panel).findByRole("button", { name: "시작 01:40로 이동" }));

    expect(video.currentTime).toBe(100);
  });

  it("[SPEC-031 R-8] 위험이 없으면 없다고 보인다", async () => {
    renderAnalysisDetail(analysisHandlers({ risks: [] }));
    const panel = await riskPanel();
    expect(await within(panel).findByText("위험 상태가 없습니다.")).toBeVisible();
  });

  it("[SPEC-031 R-9] 예측이 있으면 구간별 노출 확률을 참고용 표시와 함께 보인다", async () => {
    renderAnalysisDetail(analysisHandlers({ risks: [riskBody({ forecast: riskForecastBody() })] }));
    const panel = await riskPanel();

    const forecast = await within(panel).findByRole("list", { name: "노출 예측" });
    expect(within(panel).getByText("참고용")).toBeVisible();
    expect(within(forecast).getByText("10분 뒤 노출 확률 42%")).toBeVisible();
    expect(within(forecast).getByText("30분 뒤 노출 확률 71%")).toBeVisible();
  });

  it.each([
    ["없으면", null],
    ["형식이 틀리면", { method: "unknown", horizons: "x" }],
    ["구간이 비면", { method: "rule", horizons: [], features: {} }],
  ])("[SPEC-031 R-9] 예측이 %s 그 자리를 비운다", async (_case, forecast) => {
    renderAnalysisDetail(analysisHandlers({ risks: [riskBody({ forecast })] }));
    const panel = await riskPanel();
    await within(panel).findByText("안전모 미착용");
    expect(within(panel).queryByText("참고용")).not.toBeInTheDocument();
  });
});
