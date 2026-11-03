import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { handlers, MEDIA_API, mediaHandlers, videoBody, videoPageBody } from "../../mocks/handlers";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { startSession } from "../shared/api/session";

describe("영상 분석 화면의 업로드", () => {
  it("[SPEC-005 R-7] 업로드를 마치면 목록을 다시 불러와 올린 영상을 보여 준다", async () => {
    let uploaded = false;
    // server.use는 앞에 둔 핸들러가 먼저 적용되므로 기본 media 핸들러를 맨 뒤에 둔다.
    server.use(
      handlers.me(),
      http.get(MEDIA_API, () =>
        HttpResponse.json(
          videoPageBody(
            uploaded ? [videoBody({ id: "a.mp4", fileName: "a.mp4", status: "UPLOADED" })] : [],
          ),
        ),
      ),
      http.post(`${MEDIA_API}/:id/complete`, () => {
        uploaded = true;
        return HttpResponse.json(videoBody({ id: "a.mp4", fileName: "a.mp4", status: "UPLOADED" }));
      }),
      ...mediaHandlers(),
    );
    startSession("access-1");
    const { user } = renderRoute("/analysis");
    await screen.findByText("올린 영상이 없습니다.");

    await user.upload(screen.getByLabelText("영상 파일 고르기"), [
      new File([new Uint8Array(10)], "a.mp4"),
    ]);

    const list = await screen.findByRole("list", { name: "내 영상" });
    expect(within(list).getByText("a.mp4")).toBeVisible();
  });
});
