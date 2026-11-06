import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { workSessionBody, WORK_SESSION_ID } from "../../mocks/media";
import { renderSessionDetail } from "../../tests/sessionDetail";

describe("세션 상세에서 업로드로", () => {
  it("[SPEC-034 R-8] 이 세션에 영상 올리기를 누르면 그 세션이 골라진 업로드 화면을 연다", async () => {
    const { user, router } = renderSessionDetail([], {
      session: { sessions: [workSessionBody()] },
    });

    await user.click(await screen.findByRole("link", { name: "이 세션에 영상 올리기" }));

    expect(await screen.findByRole("heading", { name: "영상 분석" })).toBeVisible();
    expect(router.state.location.search).toBe(`?sessionId=${WORK_SESSION_ID}`);
    const select = await screen.findByRole("combobox", { name: "작업 세션" });
    await waitFor(() => {
      expect(select).toHaveDisplayValue("3번 라인 방호벽 교체");
    });
    expect(screen.getByRole("radiogroup", { name: "역할" })).toBeVisible();
  });

  it("[SPEC-034 R-8] 주소의 sessionId가 UUID가 아니면 세션 없이 시작한다", async () => {
    const { router } = renderSessionDetail([], { path: "/analysis?sessionId=abc" });

    expect(await screen.findByRole("combobox", { name: "작업 세션" })).toHaveDisplayValue(
      "세션 없음",
    );
    expect(router.state.location.pathname).toBe("/analysis");
  });
});
