import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { layoutVideo, seekVideo } from "../../../../tests/player";
import { usePlayerController } from "../hooks/usePlayerController";
import type { OverlayTrackInput } from "../model/overlayFrame";
import { OverlayLayer } from "./OverlayLayer";
import { VideoPlayer } from "./VideoPlayer";

const TRACKS: OverlayTrackInput[] = [
  {
    trackId: "t1",
    className: "person",
    hasEvent: false,
    boxes: [{ ptsMs: 40000, box: { x: 0.1, y: 0.1, w: 0.2, h: 0.3 } }],
  },
  {
    trackId: "t2",
    className: "forklift",
    hasEvent: true,
    boxes: [{ ptsMs: 40000, box: { x: 0.5, y: 0.5, w: 0.2, h: 0.2 } }],
  },
];

function Harness({ tracks }: { tracks: OverlayTrackInput[] }) {
  const controller = usePlayerController();
  return (
    <VideoPlayer
      label="a.mp4 재생"
      src="http://localhost/a.mp4"
      controller={controller}
      overlay={<OverlayLayer controller={controller} tracks={tracks} />}
    />
  );
}

function setUp(seconds: number) {
  render(<Harness tracks={TRACKS} />);
  const video = screen.getByLabelText<HTMLVideoElement>("a.mp4 재생");
  layoutVideo(video);
  seekVideo(video, seconds);
}

describe("OverlayLayer", () => {
  it("[SPEC-032 R-1] 재생 시각에 가장 가까운 박스와 클래스를 표시 영역 비율로 그린다", () => {
    setUp(40.2);

    expect(screen.getByRole("img", { name: "객체 박스 2개" })).toBeInTheDocument();
    expect(screen.getByText("person")).toHaveStyle({ left: "10%", top: "10%" });
    expect(screen.getByText(/forklift/)).toBeInTheDocument();
  });

  it("[SPEC-032 R-1] 탐지 시각에서 500ms보다 멀면 박스를 그리지 않는다", () => {
    setUp(41);

    expect(screen.getByRole("img", { name: "객체 박스 0개" })).toBeInTheDocument();
    expect(screen.queryByText("person")).not.toBeInTheDocument();
  });

  it("[SPEC-032 NFR-1] 그리기 시간을 overlay-draw로 남긴다", () => {
    performance.clearMeasures("overlay-draw");
    setUp(40.2);

    expect(performance.getEntriesByName("overlay-draw").length).toBeGreaterThan(0);
  });
});
