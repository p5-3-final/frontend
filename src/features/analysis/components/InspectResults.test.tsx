import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ANALYSIS_API, analysisHandlers } from "../../../../mocks/analysis";
import { missInspectBody } from "../../../../mocks/inspect";
import { renderAnalysisDetail } from "../../../../tests/analysisDetail";
import { clickFrame, readyPlayer } from "../../../../tests/inspect";
import { server } from "../../../../tests/server";

describe("InspectResults", () => {
  it("[SPEC-032 R-6] 누른 곳에 객체가 없으면 안내하고 열린 트랙 패널을 닫는다", async () => {
    const { user } = renderAnalysisDetail(analysisHandlers());
    await readyPlayer();
    await clickFrame(user);
    expect(await screen.findByRole("region", { name: "트랙 정보" })).toBeVisible();

    server.use(
      http.get(`${ANALYSIS_API}/sources/:sourceId/inspect`, () =>
        HttpResponse.json(missInspectBody()),
      ),
    );
    await clickFrame(user, 0.9, 0.9);

    expect(await screen.findByText("이 위치에서 찾은 객체가 없습니다.")).toBeVisible();
    expect(screen.queryByRole("region", { name: "트랙 정보" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "선택한 객체 위치" })).not.toBeInTheDocument();
  });

  it("[SPEC-032 R-6] 조회가 실패하면 실패 안내를 보인다", async () => {
    const { user } = renderAnalysisDetail([
      http.get(`${ANALYSIS_API}/sources/:sourceId/inspect`, () =>
        HttpResponse.json(null, { status: 503 }),
      ),
      ...analysisHandlers(),
    ]);
    await readyPlayer();

    await clickFrame(user);

    expect(await screen.findByText("객체를 조회하지 못했습니다. 다시 눌러 주세요.")).toBeVisible();
  });
});
