import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { handlers } from "../../../mocks/handlers";
import { renderRoute } from "../../../tests/render";
import { server } from "../../../tests/server";
import { startSession } from "../../shared/api/session";

async function renderApp() {
  server.use(handlers.me());
  startSession("access-1");
  const view = renderRoute("/analysis");
  await screen.findByRole("heading", { name: "영상 분석" });
  return view;
}

describe("MobileNav", () => {
  it("[SPEC-002 NFR-5] 메뉴 버튼을 누르면 메뉴 서랍을 열고 첫 메뉴에 초점을 둔다", async () => {
    const { user } = await renderApp();

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    const drawer = screen.getByRole("dialog", { name: "메뉴" });
    expect(within(drawer).getByRole("link", { name: "영상 분석" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("[SPEC-002 NFR-5] Escape를 누르면 서랍을 닫고 메뉴 버튼으로 초점을 돌려준다", async () => {
    const { user } = await renderApp();
    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "메뉴" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveFocus();
  });

  it("[SPEC-002 NFR-5] 서랍에서 메뉴를 고르면 그 화면으로 가고 서랍을 닫는다", async () => {
    const { user, router } = await renderApp();
    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    await user.click(
      within(screen.getByRole("dialog", { name: "메뉴" })).getByRole("link", { name: "검색" }),
    );

    expect(await screen.findByRole("heading", { name: "검색" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/search");
    expect(screen.queryByRole("dialog", { name: "메뉴" })).not.toBeInTheDocument();
  });
});
