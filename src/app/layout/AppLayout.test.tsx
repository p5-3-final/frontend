import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { handlers, TEST_USER } from "../../../mocks/handlers";
import { renderRoute } from "../../../tests/render";
import { server } from "../../../tests/server";
import { startSession } from "../../shared/api/session";

const MENU = ["영상 분석", "이벤트", "검색", "분석 이력", "설정"];

describe("AppLayout", () => {
  it("[SPEC-002 R-13] 로그인 후 화면은 사이드바와 상단 바 안에 표시한다", async () => {
    server.use(handlers.me());
    startSession("access-1");
    renderRoute("/analysis");

    expect(await screen.findByRole("navigation", { name: "주 메뉴" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveTextContent("AI 안전 관제");
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("[SPEC-002 R-14] 사이드바에 다섯 메뉴를 보여 주고 현재 화면의 메뉴를 선택 상태로 표시한다", async () => {
    server.use(handlers.me());
    startSession("access-1");
    renderRoute("/search");

    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(MENU);
    expect(within(nav).getByRole("link", { name: "검색" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "이벤트" })).not.toHaveAttribute("aria-current");
  });

  it("[SPEC-002 R-13] 로그인 화면에는 사이드바를 보여 주지 않는다", async () => {
    renderRoute("/login");

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "주 메뉴" })).not.toBeInTheDocument();
  });

  it("[SPEC-035 R-1] OPERATOR에게는 사이드바에 품질 메뉴를 보여 준다", async () => {
    server.use(handlers.me({ ...TEST_USER, roles: ["USER", "OPERATOR"] }));
    startSession("access-1");
    renderRoute("/analysis");

    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    expect(await within(nav).findByRole("link", { name: "품질" })).toHaveAttribute(
      "href",
      "/quality",
    );
  });

  it("[SPEC-035 R-1] USER에게는 품질 메뉴를 숨긴다", async () => {
    server.use(handlers.me());
    startSession("access-1");
    renderRoute("/analysis");

    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    await screen.findByRole("button", { name: /테스터/ });
    expect(within(nav).queryByRole("link", { name: "품질" })).not.toBeInTheDocument();
  });
});
