import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IMPORT_GOLDEN_SET_ID, IMPORT_ID } from "../../../../../mocks/quality";
import { renderQuality } from "../../../../../tests/quality";

describe("DatasetImportDetail", () => {
  it("[SPEC-035 R-18] 상태·개수·만든 Golden Set 버전·오류 목록을 보인다", async () => {
    renderQuality(`/quality/datasets/imports/${IMPORT_ID}`);

    expect(await screen.findByRole("heading", { name: "physicalai-events" })).toBeVisible();
    const counts = screen.getByRole("region", { name: "개수" });
    expect(counts).toHaveTextContent("영상120");
    expect(counts).toHaveTextContent("등록119");
    expect(counts).toHaveTextContent("실패1");
    expect(counts).toHaveTextContent("라벨3,400");
    expect(counts).toHaveTextContent("dev95");
    expect(counts).toHaveTextContent("eval24");
    expect(screen.getByText("완료")).toBeVisible();
    expect(screen.getByRole("link", { name: "평가(eval) v1" })).toHaveAttribute(
      "href",
      `/quality/golden-sets/${IMPORT_GOLDEN_SET_ID}`,
    );
    const errors = screen.getByRole("table", { name: "오류 목록" });
    expect(within(errors).getAllByRole("row")[1]).toHaveTextContent("clip-0077");
    expect(within(errors).getAllByRole("row")[1]).toHaveTextContent("videos/clip-0077.mp4 없음");
  });

  it("[SPEC-035 R-18] 목록에서 가져오기를 누르면 상세로 간다", async () => {
    const { user, router } = renderQuality("/quality/datasets");
    const table = await screen.findByRole("table", { name: "가져오기 목록" });

    await user.click(within(table).getByRole("link", { name: /상세/ }));

    expect(router.state.location.pathname).toBe(`/quality/datasets/imports/${IMPORT_ID}`);
  });
});
