import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEARCH_MOMENT_ID, SEARCH_SOURCE_ID } from "../../../../mocks/search";
import { feedbackRecorder, renderSearch, searchPath } from "../../../../tests/searchScreen";

const SOURCE_PATH = searchPath({ q: "안전모", scope: "source", sourceId: SEARCH_SOURCE_ID });

async function jumpToDetail() {
  const feedback = feedbackRecorder();
  const view = renderSearch(SOURCE_PATH, { extra: [feedback.handler] });
  await view.user.click(await screen.findByRole("link", { name: "00:40–00:50 장면 보기" }));
  const video = await screen.findByLabelText<HTMLVideoElement>("crane.mp4 재생");
  return { ...view, feedback, video };
}

// jsdom은 미디어를 재생하지 않는다. 재생 중 상태와 위치를 직접 바꾸고 timeupdate를 일으킨다.
function playTo(video: HTMLVideoElement, seconds: number) {
  Object.defineProperty(video, "paused", { configurable: true, value: false });
  video.currentTime = seconds;
  fireEvent.timeUpdate(video);
}

function pause(video: HTMLVideoElement) {
  Object.defineProperty(video, "paused", { configurable: true, value: true });
  fireEvent.pause(video);
}

describe("usePlayedFeedback", () => {
  it("[SPEC-033 R-11] 결과를 눌러 이동하면 jumped를 한 번 기록한다", async () => {
    const { feedback, stopRecording } = await jumpToDetail();

    await waitFor(() => {
      expect(feedback.sent).toEqual([
        { momentId: SEARCH_MOMENT_ID, kind: "jumped", playedMs: undefined },
      ]);
    });
    stopRecording();
  });

  it("[SPEC-033 R-11] 이동한 영상을 5초 넘게 재생하면 재생 길이와 함께 played를 한 번 기록한다", async () => {
    const { feedback, video, stopRecording } = await jumpToDetail();

    for (let second = 39; second <= 44; second++) {
      playTo(video, second);
    }
    // 6초 재생: 38 → 44
    for (let second = 45; second <= 50; second++) {
      playTo(video, second);
    }

    await waitFor(() => {
      expect(feedback.sent.filter((item) => item.kind === "played")).toEqual([
        { momentId: SEARCH_MOMENT_ID, kind: "played", playedMs: 6000 },
      ]);
    });
    stopRecording();
  });

  it("[SPEC-033 R-11] 일시정지 중이나 위치를 옮긴 거리는 재생 시간에 넣지 않는다", async () => {
    const { feedback, video, stopRecording } = await jumpToDetail();

    playTo(video, 40);
    pause(video);
    video.currentTime = 44;
    fireEvent.timeUpdate(video);
    // 재생 중 앞으로 크게 옮김(이동)
    playTo(video, 100);
    playTo(video, 101);

    // 재생한 시간은 2초(38→40)와 1초(100→101)뿐이다.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(feedback.sent.filter((item) => item.kind === "played")).toEqual([]);
    stopRecording();
  });
});
