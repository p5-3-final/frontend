import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { handlers } from "../../../../mocks/handlers";
import { RETENTION_SETTINGS_API, retentionHandlers } from "../../../../mocks/media";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

function openSettings(extra: Parameters<typeof server.use> = [], defaultConsent = false) {
  server.use(...extra, handlers.me(), ...retentionHandlers({ defaultConsent, retained: [] }));
  startSession("access-1");
  return renderRoute("/settings");
}

describe("RetentionDefaultToggle", () => {
  it("[SPEC-034 R-9] 보존 기본값을 불러와 켜고 끄기로 보인다", async () => {
    openSettings([], true);

    const toggle = await screen.findByRole("switch", { name: "학습용 보존 기본 동의" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("[SPEC-034 R-9] 바꾸면 저장하고 이후에 올리는 영상에 적용된다고 알린다", async () => {
    let saved: unknown;
    const { user } = openSettings([
      http.put(RETENTION_SETTINGS_API, async ({ request }) => {
        saved = await request.clone().json();
        return undefined;
      }),
    ]);

    const toggle = await screen.findByRole("switch", { name: "학습용 보존 기본 동의" });
    await user.click(toggle);

    expect(await screen.findByText("이후에 올리는 영상에 적용됩니다.")).toBeVisible();
    expect(saved).toEqual({ defaultConsent: true });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("[SPEC-034 R-9] 저장이 실패하면 이전 값으로 되돌리고 이유를 보인다", async () => {
    const { user } = openSettings([
      http.put(RETENTION_SETTINGS_API, () => new HttpResponse(null, { status: 500 })),
    ]);

    const toggle = await screen.findByRole("switch", { name: "학습용 보존 기본 동의" });
    await user.click(toggle);

    expect(
      await screen.findByText("보존 기본값을 저장하지 못했습니다. 다시 시도해 주세요."),
    ).toBeVisible();
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });
});
