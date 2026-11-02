import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { endSession } from "../shared/api/session";

describe("로그인 흐름", () => {
  it("[SPEC-002 R-4] 로그인에 성공하면 영상 분석 화면으로 가고 상단 바에 닉네임을 표시한다", async () => {
    server.use(handlers.logIn(), handlers.me());
    endSession();
    const { user, router } = renderRoute("/login");

    await user.type(await screen.findByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "secret123");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("heading", { name: "영상 분석" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/analysis");
    expect(await screen.findByRole("button", { name: /테스터/ })).toBeInTheDocument();
  });
});
