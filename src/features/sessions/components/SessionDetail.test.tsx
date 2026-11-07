import { screen, waitFor, within } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ANALYSIS_API, sourceSummaryBody } from "../../../../mocks/analysis";
import { MEDIA_ROOT, sessionVideoBody, workSessionDetailBody } from "../../../../mocks/media";
import {
  AFTER_VIDEO_ID,
  BEFORE_VIDEO_ID,
  renderSessionDetail,
} from "../../../../tests/sessionDetail";

describe("SessionDetail", () => {
  it("[SPEC-034 R-3] 영상을 역할 칸(작업 전 → 작업 중 → 작업 후)에 받은 순서대로 보인다", async () => {
    renderSessionDetail([], {
      session: {
        detail: workSessionDetailBody({
          videos: [
            sessionVideoBody("BEFORE"),
            sessionVideoBody("BEFORE", {
              id: "0192f0e1-0000-7000-8000-000000000003",
              fileName: "before-2.mp4",
            }),
            sessionVideoBody("AFTER", { status: "UPLOADED" }),
          ],
        }),
      },
    });

    expect(await screen.findByRole("heading", { name: "3번 라인 방호벽 교체" })).toBeVisible();
    const columns = screen.getAllByRole("region", { name: /영상$/ });
    expect(
      columns.map((column) => column.getAttribute("aria-label") ?? column.textContent),
    ).toHaveLength(3);
    const before = screen.getByRole("region", { name: "작업 전 영상" });
    expect(
      within(before)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["before.mp4", "before-2.mp4"]);
    expect(
      within(screen.getByRole("region", { name: "작업 중 영상" })).getByText("영상 없음"),
    ).toBeVisible();
    const after = screen.getByRole("region", { name: "작업 후 영상" });
    expect(within(after).getByRole("link", { name: "after.mp4" })).toHaveAttribute(
      "href",
      `/analysis/videos/${AFTER_VIDEO_ID}`,
    );
  });

  it("[SPEC-034 R-3] 영상마다 media 상태, 분석 상태, 확정 이벤트 수, 활성 위험 수를 보인다", async () => {
    renderSessionDetail();

    const before = await screen.findByRole("listitem", { name: "before.mp4" });
    expect(within(before).getByText("분석 준비됨")).toBeVisible();
    expect(await within(before).findByText("분석됨")).toBeVisible();
    expect(within(before).getByText("확정 이벤트 2건")).toBeVisible();
    expect(within(before).getByText("활성 위험 1건")).toBeVisible();
    const after = screen.getByRole("listitem", { name: "after.mp4" });
    expect(within(after).getByText("업로드 완료")).toBeVisible();
    expect(await within(after).findByText("분석 전")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "before.mp4" })[0]).toHaveAttribute(
      "href",
      `/analysis/videos/${BEFORE_VIDEO_ID}`,
    );
  });
});

describe("SessionDetail 동시 요청", () => {
  it("[SPEC-034 NFR-1] 영상 20개 세션에서 analysis 요청을 동시에 4개까지만 보낸다", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    let finished = 0;
    const videos = Array.from({ length: 20 }, (_, index) =>
      sessionVideoBody(index < 10 ? "BEFORE" : "AFTER", {
        id: `0192f0e1-0000-7000-8000-${String(index + 100).padStart(12, "0")}`,
        fileName: `v${String(index)}.mp4`,
      }),
    );
    const slowAnalysis = http.get(`${ANALYSIS_API}/sources/:sourceId/*`, async ({ params }) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await delay(20);
      inFlight--;
      finished++;
      return HttpResponse.json(sourceSummaryBody({ sourceId: String(params.sourceId) }));
    });
    renderSessionDetail([slowAnalysis], { session: { detail: workSessionDetailBody({ videos }) } });

    await screen.findByRole("heading", { name: "3번 라인 방호벽 교체" });
    await waitFor(
      () => {
        expect(screen.queryByText("분석 정보 불러오는 중")).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
    expect(finished).toBeGreaterThanOrEqual(20);
    expect(maxInFlight).toBeLessThanOrEqual(4);
    expect(maxInFlight).toBeGreaterThan(1);
  });
});

describe("SessionDetail 오류", () => {
  it("[SPEC-034 R-12] media가 404면 세션을 찾을 수 없다는 안내와 목록 링크를 보인다", async () => {
    renderSessionDetail([], {
      path: "/history/sessions/0192f0e0-0000-7000-8000-00000000dead",
    });

    expect(await screen.findByText("세션을 찾을 수 없습니다.")).toBeVisible();
    expect(screen.getByRole("link", { name: "세션 목록으로 돌아가기" })).toHaveAttribute(
      "href",
      "/history",
    );
    expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
  });

  it("[SPEC-034 R-12] 5xx면 다시 시도 버튼을 보이고 누르면 다시 묻는다", async () => {
    let failing = true;
    const { user } = renderSessionDetail([
      http.get(`${MEDIA_ROOT}/sessions/:sessionId`, () =>
        failing ? new HttpResponse(null, { status: 503 }) : undefined,
      ),
    ]);

    const retry = await screen.findByRole("button", { name: "다시 시도" });
    expect(screen.getByText("작업 세션을 불러오지 못했습니다.")).toBeVisible();
    failing = false;
    await user.click(retry);

    expect(await screen.findByRole("heading", { name: "3번 라인 방호벽 교체" })).toBeVisible();
  });

  it("[SPEC-034 R-12] 네트워크 오류면 다시 시도 버튼을 보인다", async () => {
    renderSessionDetail([
      http.get(`${MEDIA_ROOT}/sessions/:sessionId`, () => HttpResponse.error()),
    ]);

    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeVisible();
  });
});

describe("SessionDetail 그리기 순서", () => {
  it("[SPEC-034 NFR-2] 요약 응답이 늦어도 역할 칸과 영상 이름을 먼저 그리고, 요약은 도착하면 채운다", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    renderSessionDetail([
      http.get(`${ANALYSIS_API}/sources/:sourceId/summary`, async ({ params }) => {
        await gate;
        return HttpResponse.json(sourceSummaryBody({ sourceId: String(params.sourceId) }));
      }),
    ]);

    const before = await screen.findByRole("listitem", { name: "before.mp4" });
    expect(screen.getByRole("region", { name: "작업 후 영상" })).toBeVisible();
    expect(within(before).getByText("분석 정보 불러오는 중")).toBeVisible();
    release();

    expect(await within(before).findByText("확정 이벤트 2건")).toBeVisible();
  });
});
