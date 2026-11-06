import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { handlers } from "../../../../mocks/handlers";
import { SESSIONS_API, sessionHandlers } from "../../../../mocks/media";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

async function openForm(extra: Parameters<typeof server.use> = []) {
  server.use(...extra, handlers.me(), ...sessionHandlers({ sessions: [] }));
  startSession("access-1");
  const view = renderRoute("/history");
  await screen.findByText("작업 세션이 없습니다.");
  const [headerButton] = screen.getAllByRole("button", { name: "세션 만들기" });
  await view.user.click(headerButton ?? document.body);
  return { ...view, form: await screen.findByRole("form", { name: "세션 만들기" }) };
}

describe("CreateSessionForm", () => {
  it("[SPEC-034 R-2] 이름·현장·구역으로 세션을 만들고 그 세션 상세로 이동한다", async () => {
    let body: unknown;
    const { user, form, router } = await openForm([
      http.post(SESSIONS_API, async ({ request }) => {
        body = await request.clone().json();
        return undefined;
      }),
    ]);

    await user.type(within(form).getByLabelText("세션 이름"), "3번 라인 방호벽 교체");
    await user.type(within(form).getByLabelText("현장 (선택)"), "평택 공장");
    await user.click(within(form).getByRole("button", { name: "만들기" }));

    expect(await screen.findByRole("heading", { name: "3번 라인 방호벽 교체" })).toBeVisible();
    expect(router.state.location.pathname).toMatch(/^\/history\/sessions\/[0-9a-f-]{36}$/);
    expect(body).toEqual({ name: "3번 라인 방호벽 교체", site: "평택 공장", area: null });
  });

  it("[SPEC-034 R-2] 이름이 비어 있으면 요청하지 않고 이름 칸에 이유를 보인다", async () => {
    let created = 0;
    const { user, form } = await openForm([
      http.post(SESSIONS_API, () => {
        created++;
        return undefined;
      }),
    ]);

    await user.click(within(form).getByRole("button", { name: "만들기" }));

    expect(await within(form).findByText("세션 이름을 입력해 주세요.")).toBeVisible();
    expect(within(form).getByLabelText("세션 이름")).toHaveAttribute("aria-invalid", "true");
    expect(created).toBe(0);
  });

  it("[SPEC-034 R-2] 400이면 입력 옆에 서버가 준 이유를 보인다", async () => {
    const { user, form } = await openForm([
      http.post(SESSIONS_API, () =>
        HttpResponse.json(
          {
            type: "about:blank",
            title: "Bad Request",
            status: 400,
            code: "MEDIA_INVALID_REQUEST",
            errors: [{ field: "area", message: "구역 이름은 100자 이하여야 합니다" }],
          },
          { status: 400 },
        ),
      ),
    ]);

    await user.type(within(form).getByLabelText("세션 이름"), "교체");
    await user.click(within(form).getByRole("button", { name: "만들기" }));

    expect(await within(form).findByText("구역 이름은 100자 이하여야 합니다")).toBeVisible();
    expect(within(form).getByLabelText("구역 (선택)")).toHaveAttribute("aria-invalid", "true");
  });
});
