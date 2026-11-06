import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderQuality } from "../../../../tests/quality";

describe("RequireOperator", () => {
  it("[SPEC-035 R-1] OPERATOR가 아니면 품질 경로로 직접 들어와도 권한 없음 안내를 보인다", async () => {
    renderQuality("/quality/review", { roles: ["USER"] });

    expect(await screen.findByText("이 화면을 볼 권한이 없습니다.")).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "품질 메뉴" })).not.toBeInTheDocument();
  });

  it("[SPEC-035 R-1] OPERATOR는 품질 하위 탭 다섯 개를 본다", async () => {
    renderQuality("/quality");

    const tabs = await screen.findByRole("navigation", { name: "품질 메뉴" });
    expect(tabs).toHaveTextContent("검토 큐");
    expect(tabs).toHaveTextContent("Golden Set");
    expect(tabs).toHaveTextContent("평가 실행");
    expect(tabs).toHaveTextContent("처리 단계");
    expect(tabs).toHaveTextContent("데이터셋");
  });
});
