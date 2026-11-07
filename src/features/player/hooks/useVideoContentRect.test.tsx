import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { layoutVideo, resizeVideo } from "../../../../tests/player";
import { useVideoContentRect } from "./useVideoContentRect";

function Probe() {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const rect = useVideoContentRect(video);
  return (
    <div>
      <video ref={setVideo} aria-label="영상">
        <track kind="captions" />
      </video>
      <output aria-label="표시 영역">{rect === null ? "없음" : JSON.stringify(rect)}</output>
    </div>
  );
}

describe("useVideoContentRect", () => {
  it("[SPEC-032 R-14] 메타데이터를 읽으면 표시 영역을 계산하고 창 크기가 바뀌면 다시 계산한다", () => {
    render(<Probe />);
    const video = screen.getByLabelText<HTMLVideoElement>("영상");
    expect(screen.getByLabelText("표시 영역")).toHaveTextContent("없음");

    layoutVideo(video, { width: 800, height: 600, videoWidth: 1600, videoHeight: 900 });
    expect(screen.getByLabelText("표시 영역")).toHaveTextContent(
      JSON.stringify({ left: 0, top: 75, width: 800, height: 450 }),
    );

    resizeVideo(video, { width: 1000, height: 450, videoWidth: 1600, videoHeight: 900 });
    expect(screen.getByLabelText("표시 영역")).toHaveTextContent(
      JSON.stringify({ left: 100, top: 0, width: 800, height: 450 }),
    );
  });
});
