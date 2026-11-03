import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { handlers, MEDIA_API, mediaHandlers, videoBody, videoPageBody } from "../../mocks/handlers";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { startSession } from "../shared/api/session";

const VIDEO_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";

describe("영상 상세 화면", () => {
  it("[SPEC-006 R-6] 상세 화면 주소로 바로 열면 같은 영상의 상세 화면이 열린다", async () => {
    server.use(
      handlers.me(),
      http.get(`${MEDIA_API}/:id`, ({ params }) =>
        HttpResponse.json(
          videoBody({ id: String(params.id), fileName: "lobby.mov", status: "UPLOADED" }),
        ),
      ),
      ...mediaHandlers(),
    );
    startSession("access-1");

    renderRoute(`/analysis/videos/${VIDEO_ID}`);

    expect(await screen.findByRole("heading", { name: "lobby.mov" })).toBeVisible();
  });

  it("[SPEC-006 R-13] 상세 화면에서 삭제를 확인하면 지우고 내 영상 목록으로 돌아간다", async () => {
    let deleted = false;
    const counter = { details: 0 };
    server.use(
      handlers.me(),
      http.get(MEDIA_API, () =>
        HttpResponse.json(
          videoPageBody(deleted ? [] : [videoBody({ id: VIDEO_ID, fileName: "lobby.mov" })]),
        ),
      ),
      http.get(`${MEDIA_API}/:id`, () => {
        counter.details++;
        return HttpResponse.json(
          videoBody({ id: VIDEO_ID, fileName: "lobby.mov", status: "UPLOADED" }),
        );
      }),
      http.delete(`${MEDIA_API}/:id`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
      ...mediaHandlers(),
    );
    startSession("access-1");
    const { user, router } = renderRoute(`/analysis/videos/${VIDEO_ID}`);

    await user.click(await screen.findByRole("button", { name: "lobby.mov 삭제" }));
    const dialog = screen.getByRole("dialog", { name: "영상 삭제" });
    await user.click(within(dialog).getByRole("button", { name: "삭제" }));

    expect(await screen.findByText("올린 영상이 없습니다.")).toBeVisible();
    expect(router.state.location.pathname).toBe("/analysis");
    // 지운 영상의 상세를 다시 불러와 "찾을 수 없음"이 잠깐 보이지 않게 한다.
    expect(counter.details).toBe(1);
  });
});
