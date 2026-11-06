import { expect, test } from "@playwright/test";
import { sourceSummaryBody } from "../../mocks/analysis";
import { alertRaisedBody, stateUpdatedBody } from "../../mocks/notifications";
import { sessionBody, sessionStateBody, STREAM_SESSION_ID } from "../../mocks/stream";
import { useFakeAnalysis } from "./fakeAnalysis";
import { useFakeApi } from "./fakeApi";
import { useFakeNotifications } from "./fakeNotifications";
import { useFakeStream } from "./fakeStream";

// 세션 종료는 세션 조회 주기(LIVE_POLL_MS 10초) 안에 반영된다. 여유를 둔다.
const SESSION_POLL_TIMEOUT_MS = 15_000;

test("[SPEC-031 R-19] [SPEC-031 R-20] [SPEC-031 R-21] 실시간 세션의 상태·긴급 알림을 보고 세션이 끝나면 분석 결과로 바뀐다", async ({
  page,
}) => {
  test.setTimeout(40_000);
  await useFakeApi(page, { loggedIn: true });
  const notifications = await useFakeNotifications(page);
  await useFakeAnalysis(page, { summary: sourceSummaryBody({ sourceId: STREAM_SESSION_ID }) });
  const stream = await useFakeStream(page);
  await page.goto(`/stream/sessions/${STREAM_SESSION_ID}`);

  const risk = page.getByRole("region", { name: "현재 위험" });
  await expect(risk.getByRole("list", { name: "활성 위험" }).getByRole("listitem")).toHaveCount(1);

  // R-21: 새 sequence의 개수를 바로 보이고 자세한 상태를 다시 읽는다.
  stream.state = sessionStateBody({ sequence: 17, activeRisks: [] });
  notifications.push(stateUpdatedBody(STREAM_SESSION_ID, 17));
  await expect(risk.getByText("활성 위험이 없습니다.")).toBeVisible();

  // R-20: pending은 "확인 중", 같은 후보의 confirmed는 severity와 설명으로 바뀐다.
  const banner = page.getByRole("region", { name: "새 긴급 알림" });
  notifications.push(alertRaisedBody(STREAM_SESSION_ID));
  await expect(banner.getByText("확인 중")).toBeVisible();
  notifications.push(
    alertRaisedBody(STREAM_SESSION_ID, {
      status: "confirmed",
      description: "작업자 한 명이 바닥에 쓰러져 움직이지 않습니다.",
    }),
  );
  await expect(banner.getByText("작업자 한 명이 바닥에 쓰러져 움직이지 않습니다.")).toBeVisible();
  await expect(banner.getByText("확인 중")).toHaveCount(0);
  await expect(banner.getByRole("img", { name: "심각도 높음" })).toBeVisible();

  // R-19: 세션이 닫히면 analysis 결과를 보인다.
  stream.session = sessionBody({ status: "CLOSED", closedAt: "2026-11-06T10:30:00Z" });
  await expect(page.getByRole("region", { name: "분석 요약" })).toBeVisible({
    timeout: SESSION_POLL_TIMEOUT_MS,
  });
  await expect(page.getByRole("region", { name: "현재 위험" })).toHaveCount(0);
});
