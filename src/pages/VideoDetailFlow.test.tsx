import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { handlers, MEDIA_API, mediaHandlers, videoBody } from "../../mocks/handlers";
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
});
