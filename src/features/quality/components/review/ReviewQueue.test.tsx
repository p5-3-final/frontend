import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { problem } from "../../../../../mocks/handlers";
import {
  OPERATOR_ID,
  OTHER_OPERATOR_ID,
  QUALITY_API,
  REVIEW_ITEM_ID,
  reviewItemBody,
} from "../../../../../mocks/quality";
import { recordRequests } from "../../../../../tests/analysisDetail";
import { renderQuality } from "../../../../../tests/quality";

function reviewRequests(requests: URL[]) {
  return requests.filter((url) => url.pathname === "/api/v1/quality/review-items");
}

describe("ReviewQueue", () => {
  it("[SPEC-035 R-2] 기본은 대기 항목을 만든 순서로 보이고 행마다 유형·구간·판정 방식·사유·상태를 보인다", async () => {
    renderQuality("/quality/review");

    const list = await screen.findByRole("table", { name: "검토 항목" });
    const rows = within(list).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("보호구 미착용");
    expect(rows[0]).toHaveTextContent("01:35 ~ 01:45");
    expect(rows[0]).toHaveTextContent("rule+vlm+escalate");
    expect(rows[0]).toHaveTextContent("검토 필요");
    expect(rows[0]).toHaveTextContent("대기");
    expect(rows[1]).toHaveTextContent("쓰러짐");
    expect(rows[1]).toHaveTextContent("예산 초과");
  });

  it("[SPEC-035 R-2] 맡은 사람이 나면 '나', 다른 운영자면 '다른 운영자'로 보인다", async () => {
    renderQuality("/quality/review?status=all", {
      fixture: {
        reviewItems: [
          reviewItemBody({ status: "ASSIGNED", assigneeId: OPERATOR_ID }),
          reviewItemBody({
            itemId: "0192fa00-0000-5000-8000-000000000009",
            status: "ASSIGNED",
            assigneeId: OTHER_OPERATOR_ID,
            createdAt: "2026-11-06T09:30:00Z",
          }),
        ],
      },
    });

    const list = await screen.findByRole("table", { name: "검토 항목" });
    const rows = within(list).getAllByRole("row").slice(1);
    expect(within(rows[0] ?? list).getByRole("cell", { name: "나" })).toBeVisible();
    expect(within(rows[0] ?? list).getByRole("link", { name: "이어서 보기" })).toBeVisible();
    expect(within(rows[1] ?? list).getByRole("cell", { name: "다른 운영자" })).toBeVisible();
  });

  it("[SPEC-035 R-2] 상태·유형을 고르면 그 조건으로 다시 요청하고 URL에 남긴다", async () => {
    const recorder = recordRequests();
    const { user, router } = renderQuality("/quality/review");
    await screen.findByRole("table", { name: "검토 항목" });

    await user.selectOptions(screen.getByLabelText("상태"), "LABELED");
    await user.selectOptions(screen.getByLabelText("유형"), "ppe_missing");

    const list = await screen.findByRole("table", { name: "검토 항목" });
    expect(await within(list).findByText("라벨 완료")).toBeVisible();
    const last = reviewRequests(recorder.requests).at(-1);
    expect(last?.searchParams.get("status")).toBe("LABELED");
    expect(last?.searchParams.get("eventType")).toBe("ppe_missing");
    expect(router.state.location.search).toContain("eventType=ppe_missing");
    recorder.stop();
  });

  it("[SPEC-035 R-2] 다음 쪽으로 가면 그 쪽 번호로 요청한다", async () => {
    const many = Array.from({ length: 25 }, (_, index) =>
      reviewItemBody({
        itemId: `0192fa00-0000-5000-8000-${String(index).padStart(12, "0")}`,
        createdAt: `2026-11-06T09:${String(index).padStart(2, "0")}:00Z`,
      }),
    );
    const recorder = recordRequests();
    const { user } = renderQuality("/quality/review", { fixture: { reviewItems: many } });
    await screen.findByRole("table", { name: "검토 항목" });

    await user.click(screen.getByRole("button", { name: "다음 쪽" }));

    expect(await screen.findByText("2 / 2쪽")).toBeVisible();
    expect(reviewRequests(recorder.requests).at(-1)?.searchParams.get("page")).toBe("1");
    recorder.stop();
  });

  it("[SPEC-035 R-3] 맡기를 누르면 맡기를 요청하고 같은 거르기 조건으로 상세를 연다", async () => {
    const { user, router } = renderQuality("/quality/review?eventType=ppe_missing");
    const list = await screen.findByRole("table", { name: "검토 항목" });

    await user.click(within(list).getAllByRole("button", { name: "맡기" })[0] ?? list);

    await screen.findByRole("heading", { name: "검토 상세" });
    expect(router.state.location.pathname).toBe(`/quality/review/${REVIEW_ITEM_ID}`);
    expect(router.state.location.search).toContain("eventType=ppe_missing");
  });

  it.each([
    ["QUALITY_REVIEW_ALREADY_ASSIGNED", "이미 다른 사람이 맡았습니다."],
    ["QUALITY_REVIEW_ALREADY_LABELED", "이미 라벨된 항목입니다."],
  ])(
    "[SPEC-035 R-3] 맡기가 409 %s이면 안내를 보이고 목록을 다시 불러온다",
    async (code, message) => {
      const recorder = recordRequests();
      const { user } = renderQuality("/quality/review", {
        extra: [
          http.post(`${QUALITY_API}/review-items/:itemId/assignment`, () => problem(409, code)),
        ],
      });
      const list = await screen.findByRole("table", { name: "검토 항목" });
      const before = reviewRequests(recorder.requests).length;

      await user.click(within(list).getAllByRole("button", { name: "맡기" })[0] ?? list);

      expect(await screen.findByText(message)).toBeVisible();
      await expect.poll(() => reviewRequests(recorder.requests).length).toBeGreaterThan(before);
      recorder.stop();
    },
  );
});
