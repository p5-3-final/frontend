import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";

describe("가입 흐름", () => {
  it("[SPEC-002 R-1] 가입에 성공하면 안내와 함께 로그인 화면으로 가고 이메일 칸을 채운다", async () => {
    // 처음 온 방문자라 재발급 쿠키가 없다.
    server.use(
      handlers.refreshFails(),
      http.post("http://localhost:8080/api/v1/auth/signup", () =>
        HttpResponse.json(
          {
            id: "27e8fd1d-d3ae-42f2-bb55-ff6f9c8661dc",
            email: "user@example.com",
            nickname: "테스터",
            roles: ["USER"],
          },
          { status: 201 },
        ),
      ),
    );
    const { user, router } = renderRoute("/signup");

    await user.type(await screen.findByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "secret123");
    await user.type(screen.getByLabelText("닉네임"), "테스터");
    await user.click(screen.getByRole("button", { name: "가입하기" }));

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.getByRole("status")).toHaveTextContent("가입이 완료되었습니다. 로그인해 주세요.");
    expect(screen.getByLabelText("이메일")).toHaveValue("user@example.com");
  });
});
