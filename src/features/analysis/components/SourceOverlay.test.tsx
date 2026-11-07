import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ANALYSIS_SOURCE_ID, analysisHandlers } from "../../../../mocks/analysis";
import { overlayTrackBody } from "../../../../mocks/inspect";
import { recordRequests, renderAnalysisDetail } from "../../../../tests/analysisDetail";
import { readyPlayer } from "../../../../tests/inspect";

describe("SourceOverlay", () => {
  it("[SPEC-032 R-1] 오버레이를 켜면 현재·다음 10초 구간을 받아 가장 가까운 박스와 클래스를 그린다", async () => {
    const recorder = recordRequests();
    const { user } = renderAnalysisDetail(analysisHandlers());
    await readyPlayer(40.2);

    await user.click(screen.getByRole("button", { name: "오버레이" }));

    expect(await screen.findByText("사람 · 이벤트")).toBeVisible();
    expect(screen.getByRole("img", { name: "객체 박스 1개" })).toBeInTheDocument();
    recorder.stop();
    const windows = recorder.requests
      .filter((url) => url.pathname.endsWith("/overlay"))
      .map(
        (url) => `${url.searchParams.get("fromMs") ?? ""}-${url.searchParams.get("toMs") ?? ""}`,
      );
    expect(new Set(windows)).toEqual(new Set(["40000-50000", "50000-60000"]));
  });
});

describe("SourceOverlay 켜고 끄기", () => {
  it("[SPEC-032 R-2] 이벤트가 있는 트랙은 글자로도 구분해 강조하고, 없는 트랙은 클래스만 보인다", async () => {
    const { user } = renderAnalysisDetail(
      analysisHandlers({
        inspect: {
          overlayTracks: (fromMs) =>
            fromMs === 40000
              ? [
                  overlayTrackBody(),
                  overlayTrackBody({
                    trackId: "0192f200-0000-5000-8000-000000000002",
                    className: "forklift",
                    hasEvent: false,
                  }),
                ]
              : [],
        },
      }),
    );
    await readyPlayer(40.2);

    await user.click(screen.getByRole("button", { name: "오버레이" }));

    expect(await screen.findByText("사람 · 이벤트")).toBeVisible();
    expect(screen.getByText("지게차")).toBeVisible();
  });

  it("[SPEC-032 R-2] 오버레이는 기본 꺼짐이고 다른 영상으로 가면 다시 꺼진다", async () => {
    const recorder = recordRequests();
    const { user, router } = renderAnalysisDetail(analysisHandlers());
    await readyPlayer(40.2);
    const toggle = screen.getByRole("button", { name: "오버레이" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(recorder.requests.some((url) => url.pathname.endsWith("/overlay"))).toBe(false);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await router.navigate(`/analysis/videos/${ANALYSIS_SOURCE_ID.replace("9e0f", "9e10")}`);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "오버레이" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });
    recorder.stop();
  });
});
