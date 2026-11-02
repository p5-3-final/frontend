import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { endSession, startSession } from "../shared/api/session";

describe("키보드 조작", () => {
  it("[SPEC-002 NFR-2] 로그인 화면을 Tab과 Enter만으로 쓸 수 있다", async () => {
    server.use(handlers.logIn(), handlers.me());
    endSession();
    const { user } = renderRoute("/login");
    await screen.findByLabelText("이메일");

    await user.tab();
    expect(screen.getByLabelText("이메일")).toHaveFocus();
    await user.keyboard("user@example.com");
    await user.tab();
    expect(screen.getByLabelText("비밀번호")).toHaveFocus();
    await user.keyboard("secret123{Enter}");

    expect(await screen.findByRole("heading", { name: "영상 분석" })).toBeInTheDocument();
  });

  it("[SPEC-002 NFR-2] 가입 화면의 입력 칸과 버튼, 로그인 링크를 Tab 순서대로 지난다", async () => {
    server.use(handlers.refreshFails());
    const { user } = renderRoute("/signup");
    await screen.findByLabelText("이메일");

    const expected = [
      screen.getByLabelText("이메일"),
      screen.getByLabelText("비밀번호"),
      screen.getByLabelText("닉네임"),
      screen.getByRole("button", { name: "가입하기" }),
      screen.getByRole("link", { name: "로그인" }),
    ];
    for (const element of expected) {
      await user.tab();
      expect(element).toHaveFocus();
    }
  });

  it("[SPEC-002 NFR-2] 사용자 메뉴를 열고 로그아웃까지 키보드로 할 수 있다", async () => {
    server.use(handlers.me(), handlers.logOut());
    startSession("access-1");
    const { user } = renderRoute("/analysis");
    const menuButton = await screen.findByRole("button", { name: /테스터/ });

    menuButton.focus();
    await user.keyboard("{Enter}");
    await user.tab();
    expect(screen.getByRole("button", { name: "로그아웃" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
  });
});
