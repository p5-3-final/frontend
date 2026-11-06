import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sourceSummaryBody } from "../../../../mocks/analysis";
import { createPlayerController } from "../../player";
import { sourceSummarySchema } from "../model/schemas";
import { SummaryPanel } from "./SummaryPanel";

function renderPanel(overrides: Parameters<typeof sourceSummaryBody>[0] = {}) {
  const controller = createPlayerController();
  const summary = sourceSummarySchema.parse(sourceSummaryBody(overrides));
  render(<SummaryPanel summary={summary} controller={controller} />);
  return { controller, user: userEvent.setup() };
}

describe("SummaryPanel", () => {
  it("[SPEC-031 R-2] 요약문과 이벤트·확정 이벤트·활성 위험 수를 보인다", () => {
    renderPanel();
    const panel = screen.getByRole("region", { name: "분석 요약" });

    expect(
      within(panel).getByText("A동 크레인 하부에서 안전모 미착용 작업자가 확인되었습니다."),
    ).toBeVisible();
    expect(within(panel).getByRole("group", { name: "이벤트" })).toHaveTextContent("3");
    expect(within(panel).getByRole("group", { name: "확정 이벤트" })).toHaveTextContent("2");
    expect(within(panel).getByRole("group", { name: "활성 위험" })).toHaveTextContent("1");
  });

  it("[SPEC-031 R-2] 요약의 강조 시각을 누르면 플레이어가 그 시각으로 간다", async () => {
    const { controller, user } = renderPanel();

    await user.click(screen.getByRole("button", { name: "01:35 안전모 미착용" }));

    expect(controller.getSnapshot().currentMs).toBe(95000);
  });

  it.each([
    ["not_configured", "요약 모델이 설정되지 않아 요약문이 없습니다."],
    ["failed", "요약문을 만들지 못했습니다."],
    ["empty", "요약할 내용이 없습니다."],
  ] as const)("[SPEC-031 R-2] 요약 상태가 %s이면 상태별 안내를 보인다", (status, message) => {
    renderPanel({ summary: { status, text: null, highlights: [] } });
    expect(screen.getByText(message)).toBeVisible();
  });

  it("[SPEC-031 R-2] 요약이 없으면 empty와 같게 보고, 개수 키가 없으면 0이다", () => {
    renderPanel({ summary: null, counts: {} });
    expect(screen.getByText("요약할 내용이 없습니다.")).toBeVisible();
    expect(screen.getByRole("group", { name: "활성 위험" })).toHaveTextContent("0");
  });

  it("[SPEC-031 R-2] 판정하지 않은 이벤트 유형과 이유를 보인다", () => {
    renderPanel();
    const list = screen.getByRole("list", { name: "이 분석에서 판정하지 않은 이벤트" });
    expect(within(list).getByText("방호 미복구")).toBeVisible();
    expect(within(list).getByText("구역 정의 없음")).toBeVisible();
  });

  it("[SPEC-031 R-2] 작업 세션 역할과 직전 영상 상태 사용 여부를 보인다", () => {
    renderPanel({
      session: {
        sessionId: "0192f0e0-0000-7000-8000-000000000001",
        role: "AFTER",
        previousSourceId: "0192f0d2-0000-7000-8000-000000000002",
        initialStateUsed: true,
      },
    });
    expect(screen.getByText("작업 후 영상")).toBeVisible();
    expect(screen.getByText("직전 영상의 마지막 상태로 시작함")).toBeVisible();
  });
});
