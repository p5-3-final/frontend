import { act, screen, waitFor, within } from "@testing-library/react";
import { http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { problem } from "../../../../mocks/handlers";
import { cameraBody, CAMERA_ID, STREAM_API, STREAM_SESSION_ID } from "../../../../mocks/stream";
import { recordRequests } from "../../../../tests/analysisDetail";
import { renderCameras } from "../../../../tests/cameras";

const PATH = `/history/cameras/${CAMERA_ID}`;
const idle = cameraBody({ status: "IDLE", activeSessionId: null });

afterEach(() => {
  vi.useRealTimers();
});

describe("CameraDetail", () => {
  it("[SPEC-034 R-13] 카메라 정보와 상태를 보이고, 수집 중이면 실시간 세션으로 이동할 수 있다", async () => {
    renderCameras(PATH);

    expect(await screen.findByRole("heading", { name: "A동 크레인" })).toBeVisible();
    expect(screen.getByText("cameras/a-dong-crane/rtsp")).toBeVisible();
    expect(screen.getByText("ingest-default@1")).toBeVisible();
    expect(screen.getAllByText("수집 중").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "실시간 세션 열기" })).toHaveAttribute(
      "href",
      `/stream/sessions/${STREAM_SESSION_ID}`,
    );
  });

  it("[SPEC-034 R-13] 세션이 없으면 수집 시작을 요청하고 상태를 갱신한다", async () => {
    const { user } = renderCameras(PATH, [], { cameras: [idle], sessions: [] });

    await user.click(await screen.findByRole("button", { name: "수집 시작" }));

    expect(await screen.findByRole("button", { name: "수집 중지" })).toBeVisible();
    expect(screen.getAllByText("시작 중").length).toBeGreaterThan(0);
  });

  it("[SPEC-034 R-13] 수집 중지를 요청하면 중지 중으로 바뀐다", async () => {
    const { user } = renderCameras(PATH);

    await user.click(await screen.findByRole("button", { name: "수집 중지" }));

    await waitFor(() => {
      expect(screen.getAllByText("중지 중").length).toBeGreaterThan(0);
    });
  });

  it("[SPEC-034 R-13] 이미 활성 세션이 있어 409면 안내 문구를 보인다", async () => {
    const { user } = renderCameras(
      PATH,
      [
        http.post(`${STREAM_API}/cameras/:cameraId/sessions`, () =>
          problem(409, "STREAM_SESSION_ALREADY_ACTIVE"),
        ),
      ],
      { cameras: [idle], sessions: [] },
    );

    await user.click(await screen.findByRole("button", { name: "수집 시작" }));

    expect(
      await screen.findByText(
        "이 카메라에 진행 중인 세션이 있습니다. 중지한 뒤 다시 시작해 주세요.",
      ),
    ).toBeVisible();
  });

  it("[SPEC-034 R-13] 상태를 15초마다 다시 읽는다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const recorder = recordRequests();
    renderCameras(PATH);
    await screen.findByRole("heading", { name: "A동 크레인" });
    const reads = () =>
      recorder.requests.filter((url) => url.pathname === `/api/v1/stream/cameras/${CAMERA_ID}`)
        .length;
    const first = reads();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    await waitFor(() => {
      expect(reads()).toBeGreaterThan(first);
    });
    recorder.stop();
  });

  it("[SPEC-034 R-13] 없는 카메라면 찾을 수 없다고 안내한다", async () => {
    renderCameras("/history/cameras/0192fb00-0000-7000-8000-00000000dead");

    expect(await screen.findByText("카메라나 세션을 찾을 수 없습니다.")).toBeVisible();
    expect(
      within(screen.getByRole("main")).getByRole("link", { name: "카메라 목록으로 돌아가기" }),
    ).toBeVisible();
  });
});
