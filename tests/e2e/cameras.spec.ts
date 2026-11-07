import { expect, test } from "@playwright/test";
import { sessionBody } from "../../mocks/stream";
import { useFakeAnalysis } from "./fakeAnalysis";
import { useFakeApi } from "./fakeApi";
import { useFakeCameras } from "./fakeCameras";
import { useFakeNotifications } from "./fakeNotifications";
import { useFakeStream } from "./fakeStream";

const ROTATED_FROM = "0192fb00-0000-7000-8000-000000000701";
const ROTATED_TO = "0192fb00-0000-7000-8000-000000000702";

test("[SPEC-034 R-13] [SPEC-034 R-14] [SPEC-031 R-19] 카메라를 등록하고 수집을 시작해 실시간 세션을 연 뒤 중지하고 이력을 본다", async ({
  page,
}) => {
  test.setTimeout(40_000);
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeAnalysis(page);
  await useFakeStream(page);
  const cameras = await useFakeCameras(page);

  await page.goto("/history/cameras");
  await expect(page.getByText("등록한 카메라가 없습니다.")).toBeVisible();
  await page.getByRole("button", { name: "카메라 등록" }).first().click();
  const form = page.getByRole("form", { name: "카메라 등록" });
  await form.getByLabel("카메라 이름").fill("A동 크레인");
  await form.getByLabel("RTSP 비밀값 참조 이름").fill("cameras/a-dong-crane/rtsp");
  await form.getByRole("button", { name: "등록" }).click();
  await page
    .getByRole("list", { name: "카메라" })
    .getByRole("link", { name: "A동 크레인" })
    .click();

  await page.getByRole("button", { name: "수집 시작" }).click();
  await expect(page.getByRole("button", { name: "수집 중지" })).toBeVisible();
  const started = cameras.state.sessions[0]?.sessionId ?? "";
  cameras.goLive(started);
  await page.reload();
  await page.getByRole("link", { name: "실시간 세션 열기" }).click();
  await expect(page).toHaveURL(new RegExp(`/stream/sessions/${started}$`));
  await expect(page.getByRole("heading", { name: "실시간 세션" })).toBeVisible();

  await page.goBack();
  await page.getByRole("button", { name: "수집 중지" }).click();
  const history = page.getByRole("region", { name: "세션 이력" });
  await expect(history.getByText("중지 중")).toBeVisible();

  // R-14: 24시간 회전으로 이어진 세션은 한 묶음으로 보인다.
  const cameraId = cameras.state.cameras[0]?.cameraId ?? "";
  cameras.state.sessions.push(
    sessionBody({
      sessionId: ROTATED_TO,
      sourceId: ROTATED_TO,
      cameraId,
      status: "CLOSED",
      previousSourceId: ROTATED_FROM,
    }),
    sessionBody({ sessionId: ROTATED_FROM, sourceId: ROTATED_FROM, cameraId, status: "CLOSED" }),
  );
  await page.reload();
  await expect(history.getByRole("list", { name: /^세션 묶음/ })).toHaveCount(2);
  await expect(history.getByText("24시간 회전으로 이어짐")).toHaveCount(1);
});

test("[SPEC-031 R-19] Chromium에서 라이브 HLS 재생 목록은 hls.js가 받는다", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "hls.js 경로는 HLS를 기본 재생하지 못하는 브라우저에서만 쓴다",
  );
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeAnalysis(page);
  await useFakeStream(page);
  // <video>가 직접 받으면 resourceType이 media이고, hls.js가 받으면 xhr·fetch다.
  const playlistTypes: string[] = [];
  await page.route("**/*.m3u8*", async (route) => {
    playlistTypes.push(route.request().resourceType());
    await route.fulfill({
      contentType: "application/vnd.apple.mpegurl",
      body: "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:2\n#EXT-X-MEDIA-SEQUENCE:0\n",
    });
  });
  await page.goto(`/stream/sessions/${sessionBody().sessionId}`);

  await expect.poll(() => playlistTypes.length).toBeGreaterThan(0);
  expect(playlistTypes.every((type) => type === "xhr" || type === "fetch")).toBe(true);
});
