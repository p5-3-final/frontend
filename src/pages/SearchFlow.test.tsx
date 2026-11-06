import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { handlers, mediaHandlers } from "../../mocks/handlers";
import { searchHandlers } from "../../mocks/search";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { startSession } from "../shared/api/session";

function setUp(path = "/search") {
  server.use(handlers.me(), ...searchHandlers(), ...mediaHandlers());
  startSession("access-1");
  return renderRoute(path);
}

describe("검색 흐름", () => {
  it("[SPEC-033 R-1] 사이드바 검색 메뉴는 준비 중 안내 대신 검색 화면을 연다", async () => {
    setUp();

    expect(await screen.findByRole("heading", { name: "검색", level: 1 })).toBeVisible();
    expect(screen.queryByText("준비 중인 기능입니다.")).not.toBeInTheDocument();
  });
});
