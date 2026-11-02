import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { API, handlers, tokenBody } from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";

describe("SessionBootstrap", () => {
  it("[SPEC-002 R-8] 새로고침하면 재발급 쿠키로 로그인 상태를 되살리고 보던 화면을 보여 준다", async () => {
    server.use(handlers.refresh(), handlers.me());
    const { router } = renderRoute("/events");

    expect(await screen.findByRole("heading", { name: "이벤트" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/events");
    expect(await screen.findByRole("button", { name: /테스터/ })).toBeInTheDocument();
  });

  it("[SPEC-002 R-8] 앱을 시작할 때 재발급은 한 번만 요청한다", async () => {
    let calls = 0;
    server.use(
      http.post(`${API}/refresh`, () => {
        calls += 1;
        return HttpResponse.json(tokenBody());
      }),
      handlers.me(),
    );
    renderRoute("/analysis");

    expect(await screen.findByRole("heading", { name: "영상 분석" })).toBeInTheDocument();
    expect(calls).toBe(1);
  });

  it("[SPEC-002 R-8] 재발급 쿠키가 없으면 로그인 화면으로 보낸다", async () => {
    server.use(handlers.refreshFails());
    const { router } = renderRoute("/events");

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?redirect=%2Fevents");
  });

  it("[SPEC-002 R-8] 로그인 상태로 로그인 화면을 열면 영상 분석 화면으로 보낸다", async () => {
    server.use(handlers.refresh(), handlers.me());
    const { router } = renderRoute("/login");

    expect(await screen.findByRole("heading", { name: "영상 분석" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/analysis");
  });
});
