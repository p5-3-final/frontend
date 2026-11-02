import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { handlers } from "../../mocks/handlers";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { startSession } from "../shared/api/session";

describe("AnalysisPage", () => {
  it("[SPEC-002 R-16] 분석한 영상이 없으면 안내와 아직 쓸 수 없는 업로드 버튼을 보여 준다", async () => {
    server.use(handlers.me());
    startSession("access-1");
    renderRoute("/analysis");

    expect(await screen.findByRole("heading", { name: "영상 분석" })).toBeInTheDocument();
    expect(screen.getByText("아직 분석한 영상이 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "영상 업로드" })).toBeDisabled();
  });
});
