import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { API, handlers, problem } from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { getAccessToken, startSession } from "../../../shared/api/session";

async function openMenu() {
  server.use(handlers.me());
  startSession("access-1");
  const view = renderRoute("/analysis");
  await view.user.click(await screen.findByRole("button", { name: /테스터/ }));
  return view;
}

describe("UserMenu", () => {
  it("[SPEC-002 R-11] 사용자 메뉴를 열면 닉네임, 이메일, 역할을 보여 준다", async () => {
    await openMenu();

    const panel = screen.getByRole("region", { name: "내 계정" });
    expect(within(panel).getByText("테스터")).toBeInTheDocument();
    expect(within(panel).getByText("user@example.com")).toBeInTheDocument();
    expect(within(panel).getByText("일반 사용자")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /테스터/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("[SPEC-002 NFR-2] Escape를 누르면 사용자 메뉴를 닫는다", async () => {
    const { user } = await openMenu();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("region", { name: "내 계정" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /테스터/ })).toHaveFocus();
  });

  it("[SPEC-002 R-12] 로그아웃하면 서버에 알리고 로그인 상태를 지운 뒤 로그인 화면으로 간다", async () => {
    let authorization: string | null = null;
    server.use(
      http.post(`${API}/logout`, ({ request }) => {
        authorization = request.headers.get("Authorization");
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user, router } = await openMenu();

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(authorization).toBe("Bearer access-1");
    expect(getAccessToken()).toBeUndefined();
  });

  it("[SPEC-002 R-12] 로그아웃 요청이 실패해도 로그인 상태를 지우고 로그인 화면으로 간다", async () => {
    server.use(http.post(`${API}/logout`, () => problem(503, "GATEWAY_UNAVAILABLE")));
    const { user, router } = await openMenu();

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(getAccessToken()).toBeUndefined();
  });
});
