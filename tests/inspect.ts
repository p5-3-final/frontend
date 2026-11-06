import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { layoutVideo, seekVideo } from "./player";

export const PLAYER_LABEL = "crane.mp4 재생";

/** 영상 상세의 플레이어에 크기를 주고(800×600, 표시 영역 800×450) 41초로 옮긴다. */
export async function readyPlayer(seconds = 41) {
  const video = await screen.findByLabelText<HTMLVideoElement>(PLAYER_LABEL);
  layoutVideo(video);
  seekVideo(video, seconds);
  return video;
}

/** 표시 영역의 (x, y) 비율 지점을 누른다. 표시 영역은 위 75px 빈 띠 아래 800×450이다. */
export async function clickFrame(user: UserEvent, x = 0.44, y = 0.3) {
  await user.pointer({
    keys: "[MouseLeft]",
    target: await screen.findByRole("button", { name: "누른 위치의 객체 조회" }),
    coords: { clientX: x * 800, clientY: 75 + y * 450 },
  });
}
