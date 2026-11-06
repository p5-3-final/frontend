import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createPlayerController } from "../model/playerController";
import type { TimelineMarker } from "../model/types";
import { PlayerControls } from "./PlayerControls";

/** 길이 200초인 영상에 연결한 조작 창구 */
function setUp(markers: TimelineMarker[] = []) {
  const video = document.createElement("video");
  Object.defineProperty(video, "duration", { configurable: true, value: 200 });
  const controller = createPlayerController();
  controller.attach(video);
  fireEvent.durationChange(video);
  const onMarkerSelect = vi.fn();
  const onFullscreen = vi.fn();
  render(
    <PlayerControls
      controller={controller}
      markers={markers}
      onMarkerSelect={onMarkerSelect}
      onFullscreen={onFullscreen}
    />,
  );
  return { video, controller, onMarkerSelect, onFullscreen, user: userEvent.setup() };
}

describe("PlayerControls", () => {
  it("[SPEC-031 R-4] 재생 버튼으로 재생하고, 재생 중이면 일시정지 버튼으로 바뀐다", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    const { video, user } = setUp();

    await user.click(screen.getByRole("button", { name: "재생" }));
    expect(play).toHaveBeenCalled();

    Object.defineProperty(video, "paused", { configurable: true, value: false });
    fireEvent.play(video);
    expect(await screen.findByRole("button", { name: "일시정지" })).toBeVisible();
  });

  it("[SPEC-031 R-4] 진행 막대로 위치를 옮기고 현재·전체 시각을 보인다", () => {
    const { video } = setUp();
    const range = screen.getByRole("slider", { name: "재생 위치" });
    expect(screen.getByText("00:00 / 03:20")).toBeVisible();

    fireEvent.change(range, { target: { value: "60000" } });

    expect(video.currentTime).toBe(60);
  });

  it("[SPEC-031 R-4] 진행 막대 위에 이벤트 위치를 표시하고 누르면 그 이벤트를 고른다", async () => {
    const { onMarkerSelect, user } = setUp([
      { id: "e1", atMs: 50_000, label: "보호구 미착용 00:50 보통", tone: "medium" },
      { id: "e2", atMs: 150_000, label: "쓰러짐 02:30 높음", tone: "high" },
    ]);

    await user.click(screen.getByRole("button", { name: "쓰러짐 02:30 높음" }));

    expect(onMarkerSelect).toHaveBeenCalledWith("e2");
    expect(screen.getByRole("button", { name: "보호구 미착용 00:50 보통" })).toBeInTheDocument();
  });

  it("[SPEC-031 R-4] 겹친 표시는 묶어 개수를 이름에 넣고 누르면 첫 이벤트를 고른다", async () => {
    const { onMarkerSelect, user } = setUp([
      { id: "e1", atMs: 50_000, label: "보호구 미착용 00:50 보통", tone: "medium" },
      { id: "e2", atMs: 50_100, label: "쓰러짐 00:50 높음", tone: "high" },
    ]);

    await user.click(screen.getByRole("button", { name: "보호구 미착용 00:50 보통 외 1건" }));

    expect(onMarkerSelect).toHaveBeenCalledWith("e1");
  });

  it("[SPEC-031 R-4] 음소거와 전체 화면을 조작한다", async () => {
    const { video, onFullscreen, user } = setUp();

    await user.click(screen.getByRole("button", { name: "음소거" }));
    expect(video.muted).toBe(true);
    expect(screen.getByRole("button", { name: "음소거 해제" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "전체 화면" }));
    expect(onFullscreen).toHaveBeenCalled();
  });
});
