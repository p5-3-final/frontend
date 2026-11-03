import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  handlers,
  MEDIA_API,
  mediaHandlers,
  playbackBody,
  STORAGE,
  videoBody,
} from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";
import type { VideoPlayback } from "../model/schemas";

const VIDEO_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";

/** 업로드가 끝난 영상 하나. 재생 주소는 요청마다 `playbacks`에서 차례로 꺼내 준다. */
function playerServer(playbacks: VideoPlayback[]) {
  const counter = { requests: 0 };
  server.use(
    handlers.me(),
    http.get(`${MEDIA_API}/:id`, () =>
      HttpResponse.json(videoBody({ id: VIDEO_ID, fileName: "parking.mp4", status: "UPLOADED" })),
    ),
    http.get(`${MEDIA_API}/:id/playback`, () => {
      const playback = playbacks[Math.min(counter.requests, playbacks.length - 1)];
      counter.requests++;
      return HttpResponse.json(playback);
    }),
    ...mediaHandlers(),
  );
  startSession("access-1");
  return counter;
}

const PLAYER = "parking.mp4 재생";

// 만료 시각이 지난 재생 주소와 그 뒤에 새로 받는 주소
const expiredPlayback = () =>
  playbackBody({
    url: `${STORAGE}/sources/v/original?X-Amz-Signature=old`,
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  });
const freshPlayback = () =>
  playbackBody({ url: `${STORAGE}/sources/v/original?X-Amz-Signature=new` });

describe("OriginalPlayer", () => {
  it("[SPEC-006 R-8] 업로드가 끝난 영상이면 재생 주소로 플레이어를 보여 주고 원본 내려받기 링크를 둔다", async () => {
    const playback = playbackBody();
    playerServer([playback]);
    renderRoute(`/analysis/videos/${VIDEO_ID}`);

    const player = await screen.findByLabelText("parking.mp4 재생");
    expect(player.tagName).toBe("VIDEO");
    expect(player).toHaveAttribute("src", playback.url);
    expect(player).toHaveAttribute("controls");
    expect(screen.getByRole("link", { name: "원본 내려받기" })).toHaveAttribute(
      "href",
      playback.downloadUrl,
    );
  });

  it("[SPEC-006 R-11] 만료 뒤 재생 오류가 나면 새 주소를 한 번 받아 보던 위치부터 이어서 재생한다", async () => {
    const fresh = freshPlayback();
    const counter = playerServer([expiredPlayback(), fresh]);
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    renderRoute(`/analysis/videos/${VIDEO_ID}`);
    const player = await screen.findByLabelText<HTMLVideoElement>(PLAYER);
    player.currentTime = 42;
    Object.defineProperty(player, "paused", { configurable: true, value: false });

    fireEvent.error(player);

    await waitFor(() => {
      expect(screen.getByLabelText(PLAYER)).toHaveAttribute("src", fresh.url);
    });
    const resumed = screen.getByLabelText<HTMLVideoElement>(PLAYER);
    fireEvent.loadedMetadata(resumed);
    expect(resumed.currentTime).toBe(42);
    expect(play).toHaveBeenCalled();
    expect(counter.requests).toBe(2);
  });

  it("[SPEC-006 R-10] 만료 전에 재생 오류가 나면 이 브라우저에서 재생할 수 없다는 안내와 원본 내려받기를 보여 준다", async () => {
    const playback = playbackBody();
    const counter = playerServer([playback]);
    renderRoute(`/analysis/videos/${VIDEO_ID}`);

    fireEvent.error(await screen.findByLabelText(PLAYER));

    expect(
      await screen.findByText(
        "이 브라우저에서 재생할 수 없는 영상입니다. 원본을 내려받아 다른 플레이어로 확인해 주세요.",
      ),
    ).toBeVisible();
    expect(screen.queryByLabelText(PLAYER)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "원본 내려받기" })).toHaveAttribute(
      "href",
      playback.downloadUrl,
    );
    expect(counter.requests).toBe(1);
  });

  it("[SPEC-006 R-10] 새 주소로 바꾼 뒤에도 재생 오류가 나면 더 받지 않고 안내를 보여 준다", async () => {
    const fresh = freshPlayback();
    const counter = playerServer([expiredPlayback(), fresh]);
    renderRoute(`/analysis/videos/${VIDEO_ID}`);
    fireEvent.error(await screen.findByLabelText(PLAYER));
    await waitFor(() => {
      expect(screen.getByLabelText(PLAYER)).toHaveAttribute("src", fresh.url);
    });

    fireEvent.error(screen.getByLabelText(PLAYER));

    expect(await screen.findByText(/이 브라우저에서 재생할 수 없는 영상입니다/)).toBeVisible();
    expect(counter.requests).toBe(2);
  });
});
