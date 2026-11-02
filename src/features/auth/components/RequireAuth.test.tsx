import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { handlers } from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { endSession } from "../../../shared/api/session";

describe("RequireAuth", () => {
  it("[SPEC-002 R-7] 로그인하지 않고 앱 화면에 들어오면 로그인 화면으로 보내고 로그인 뒤 원래 화면으로 돌려보낸다", async () => {
    server.use(handlers.logIn(), handlers.me());
    endSession();
    const { user, router } = renderRoute("/history");

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toBe("?redirect=%2Fhistory");

    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "secret123");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("heading", { name: "분석 이력" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/history");
  });

  it("[SPEC-002 R-7] 돌아갈 주소가 앱 밖을 가리키면 무시하고 영상 분석 화면으로 보낸다", async () => {
    server.use(handlers.logIn(), handlers.me());
    endSession();
    const { user, router } = renderRoute("/login?redirect=%2F%2Fevil.example.com");

    await user.type(await screen.findByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "secret123");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("heading", { name: "영상 분석" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/analysis");
  });
});
