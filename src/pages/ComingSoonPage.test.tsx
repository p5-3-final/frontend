import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { startSession } from "../shared/api/session";

describe("ComingSoonPage", () => {
  // 분석 이력·설정은 SPEC-034에서 화면이 생겼다.
  it.each([["/search", "검색"]])(
    "[SPEC-002 R-15] %s는 메뉴 이름과 준비 중이라는 안내를 보여 준다",
    async (path, title) => {
      server.use(handlers.me());
      startSession("access-1");
      renderRoute(path);

      expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
      expect(screen.getByText("준비 중인 기능입니다.")).toBeInTheDocument();
    },
  );
});
