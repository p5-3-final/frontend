import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  ANALYSIS_API,
  eventPageBody,
  eventSummaryBody,
  riskBody,
  riskListBody,
  sourceSummaryBody,
} from "../../../../mocks/analysis";
import { sessionVideoBody, workSessionDetailBody } from "../../../../mocks/media";
import {
  AFTER_VIDEO_ID,
  BEFORE_VIDEO_ID,
  renderSessionDetail,
} from "../../../../tests/sessionDetail";

const INCOMPLETE = "분석이 끝나지 않은 영상이 있어 비교가 완전하지 않습니다.";

const BARRIER_EVENT_ID = "0192f300-0000-5000-8000-000000000201";
const CARRIED_RISK_ID = "0192f500-0000-5000-8000-000000000301";

/** 두 영상 모두 분석됨. 작업 후 영상에 확정 방호 미복구 이벤트와 이어 온 위험이 있다. */
const analysedSession = [
  http.get(`${ANALYSIS_API}/sources/:sourceId/summary`, ({ params }) =>
    HttpResponse.json(sourceSummaryBody({ sourceId: String(params.sourceId) })),
  ),
  http.get(`${ANALYSIS_API}/sources/:sourceId/events`, ({ params, request }) => {
    const url = new URL(request.url);
    expect(url.searchParams.get("verificationStatus")).toBe("confirmed");
    return HttpResponse.json(
      eventPageBody(
        params.sourceId === AFTER_VIDEO_ID
          ? [
              eventSummaryBody({
                eventId: BARRIER_EVENT_ID,
                sourceId: AFTER_VIDEO_ID,
                eventType: "barrier_not_restored",
                startMs: 65000,
                origin: "rule",
              }),
            ]
          : [eventSummaryBody({ sourceId: BEFORE_VIDEO_ID, eventType: "ppe_missing" })],
      ),
    );
  }),
  http.get(`${ANALYSIS_API}/sources/:sourceId/risks`, ({ params }) =>
    HttpResponse.json(
      riskListBody(
        params.sourceId === AFTER_VIDEO_ID
          ? [
              riskBody({
                riskId: CARRIED_RISK_ID,
                riskType: "barrier_not_restored",
                reason: "방호벽 미복구",
                carriedOver: true,
                firstSeenMs: 0,
              }),
            ]
          : [riskBody()],
      ),
    ),
  ),
];

describe("SessionFlow", () => {
  it("[SPEC-034 R-4] 이어 온 위험과 확정 방호 미복구 이벤트를 영상 순서·시각 순으로 보인다", async () => {
    renderSessionDetail(analysedSession);

    const flow = await screen.findByRole("region", { name: "세션 흐름 요약" });
    const items = await within(flow).findAllByRole("listitem");
    expect(items).toHaveLength(2);
    const [carried, barrier] = items;
    expect(within(carried ?? document.body).getByText("이전 영상에서 이어짐")).toBeVisible();
    expect(within(carried ?? document.body).getByText("방호벽 미복구")).toBeVisible();
    expect(within(barrier ?? document.body).getByText("방호 미복구")).toBeVisible();
    expect(within(flow).queryByText("보호구 미착용")).not.toBeInTheDocument();
  });

  it("[SPEC-034 R-4] 이벤트를 누르면 그 영상 상세를 이벤트로, 위험을 누르면 시작 시각으로 연다", async () => {
    renderSessionDetail(analysedSession);

    const flow = await screen.findByRole("region", { name: "세션 흐름 요약" });
    const links = await within(flow).findAllByRole("link");
    expect(links[0]).toHaveAttribute("href", `/analysis/videos/${AFTER_VIDEO_ID}?t=0`);
    expect(links[1]).toHaveAttribute(
      "href",
      `/analysis/videos/${AFTER_VIDEO_ID}?event=${BARRIER_EVENT_ID}`,
    );
  });

  it("[SPEC-034 R-4] 이어 온 위험·비교 이벤트가 없으면 없다는 안내를 보인다", async () => {
    renderSessionDetail([
      http.get(`${ANALYSIS_API}/sources/:sourceId/summary`, ({ params }) =>
        HttpResponse.json(sourceSummaryBody({ sourceId: String(params.sourceId) })),
      ),
    ]);

    const flow = await screen.findByRole("region", { name: "세션 흐름 요약" });
    expect(
      await within(flow).findByText(
        "이어 온 위험이나 방호 미복구·물건 제거·이동 이벤트가 없습니다.",
      ),
    ).toBeVisible();
  });
});

describe("SessionFlow 미완료 안내", () => {
  it("[SPEC-034 R-5] 분석이 끝나지 않은 영상이 있으면 흐름 요약 위에 비교가 완전하지 않다고 알린다", async () => {
    // 기본 세션: 작업 후 영상이 UPLOADED이고 요약이 NOT_ANALYZED다.
    renderSessionDetail();

    const flow = await screen.findByRole("region", { name: "세션 흐름 요약" });
    expect(await within(flow).findByText(INCOMPLETE)).toBeVisible();
  });

  it("[SPEC-034 R-5] media는 READY여도 분석 요약이 NOT_ANALYZED면 알린다", async () => {
    renderSessionDetail([], {
      session: {
        detail: workSessionDetailBody({
          videos: [sessionVideoBody("BEFORE"), sessionVideoBody("AFTER")],
        }),
      },
    });

    const flow = await screen.findByRole("region", { name: "세션 흐름 요약" });
    expect(await within(flow).findByText(INCOMPLETE)).toBeVisible();
  });

  it("[SPEC-034 R-5] 모든 영상이 READY이고 분석됐으면 알리지 않는다", async () => {
    renderSessionDetail(analysedSession, {
      session: {
        detail: workSessionDetailBody({
          videos: [sessionVideoBody("BEFORE"), sessionVideoBody("AFTER")],
        }),
      },
    });

    const flow = await screen.findByRole("region", { name: "세션 흐름 요약" });
    await within(flow).findAllByRole("listitem");
    expect(within(flow).queryByText(INCOMPLETE)).not.toBeInTheDocument();
  });
});
