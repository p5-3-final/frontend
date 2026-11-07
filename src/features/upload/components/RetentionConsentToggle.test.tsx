import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  handlers,
  MEDIA_API,
  mediaHandlers,
  TEST_USER,
  videoBody,
} from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

const VIDEO_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";

function openDetail(extra: Parameters<typeof server.use> = [], ownerId = TEST_USER.id) {
  server.use(
    ...extra,
    handlers.me(),
    http.get(`${MEDIA_API}/:id`, () =>
      HttpResponse.json(
        videoBody({ id: VIDEO_ID, fileName: "lobby.mov", status: "UPLOADED", ownerId }),
      ),
    ),
    ...mediaHandlers(),
  );
  startSession("access-1");
  return renderRoute(`/analysis/videos/${VIDEO_ID}`);
}

describe("RetentionConsentToggle", () => {
  it("[SPEC-034 R-11] 소유자에게 영상의 학습용 보존 동의를 켜고 끄기로 보인다", async () => {
    openDetail();

    const toggle = await screen.findByRole("switch", { name: "이 영상 학습용 보존 동의" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("[SPEC-034 R-11] 바꾸면 저장하고 영상을 지울 때의 값이 적용된다고 알린다", async () => {
    let saved: unknown;
    const { user } = openDetail([
      http.put(`${MEDIA_API}/:id/retention-consent`, async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json(
          videoBody({
            id: VIDEO_ID,
            fileName: "lobby.mov",
            status: "UPLOADED",
            retentionConsent: true,
          }),
        );
      }),
    ]);

    await user.click(await screen.findByRole("switch", { name: "이 영상 학습용 보존 동의" }));

    expect(await screen.findByText("영상을 지울 때의 값이 적용됩니다.")).toBeVisible();
    expect(saved).toEqual({ consent: true });
    expect(screen.getByRole("switch", { name: "이 영상 학습용 보존 동의" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("[SPEC-034 R-11] 소유자가 아니면(ADMIN 포함) 보이지 않는다", async () => {
    openDetail([], "0192f0c4-0000-7000-8000-00000000beef");

    await screen.findByRole("heading", { name: "lobby.mov" });
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
