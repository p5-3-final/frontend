import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { layoutVideo, seekVideo, startPlaying } from "../../../../tests/player";
import { usePlayerController } from "../hooks/usePlayerController";
import { InspectLayer } from "./InspectLayer";
import { VideoPlayer } from "./VideoPlayer";

function Harness({
  onInspect,
}: {
  onInspect: (point: { tMs: number; x: number; y: number }) => void;
}) {
  const controller = usePlayerController();
  return (
    <VideoPlayer
      label="a.mp4 재생"
      src="http://localhost/a.mp4"
      controller={controller}
      overlay={<InspectLayer controller={controller} onInspect={onInspect} />}
    />
  );
}

const TARGET = "누른 위치의 객체 조회";

function setUp() {
  const onInspect = vi.fn();
  render(<Harness onInspect={onInspect} />);
  const video = screen.getByLabelText<HTMLVideoElement>("a.mp4 재생");
  // 800×600 요소에 16:9 영상: 위아래 75px 빈 띠, 표시 영역 800×450
  layoutVideo(video);
  seekVideo(video, 41);
  return { onInspect, video, user: userEvent.setup() };
}

describe("InspectLayer", () => {
  it("[SPEC-032 R-3] 일시정지한 영상을 누르면 표시 영역 기준 0~1 좌표와 현재 시각으로 조회한다", async () => {
    const { onInspect, user } = setUp();

    await user.pointer({
      keys: "[MouseLeft]",
      target: screen.getByRole("button", { name: TARGET }),
      coords: { clientX: 400, clientY: 300 },
    });

    expect(onInspect).toHaveBeenCalledWith({ tMs: 41000, x: 0.5, y: 0.5 });
  });

  it("[SPEC-032 R-3] 빈 띠(표시 영역 밖)를 누르면 조회하지 않는다", async () => {
    const { onInspect, user } = setUp();

    await user.pointer({
      keys: "[MouseLeft]",
      target: screen.getByRole("button", { name: TARGET }),
      coords: { clientX: 400, clientY: 40 },
    });

    expect(onInspect).not.toHaveBeenCalled();
  });

  it("[SPEC-032 R-3] 재생 중에는 조회 층이 없어 누를 수 없다", () => {
    const { video } = setUp();

    startPlaying(video);

    expect(screen.queryByRole("button", { name: TARGET })).not.toBeInTheDocument();
  });
});
