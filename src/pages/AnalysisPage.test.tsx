import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { handlers, mediaHandlers } from "../../mocks/handlers";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { startSession } from "../shared/api/session";

describe("AnalysisPage", () => {
  it("[SPEC-005 R-18] 올린 영상과 대기열이 비어 있으면 안내와 업로드 버튼을 보여 준다", async () => {
    server.use(handlers.me(), ...mediaHandlers());
    startSession("access-1");
    renderRoute("/analysis");

    expect(await screen.findByText("올린 영상이 없습니다.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "영상 분석" })).toBeVisible();
    expect(screen.getByRole("button", { name: "영상 업로드" })).toBeEnabled();
  });
});
