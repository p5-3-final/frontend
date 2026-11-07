import { fireEvent, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { problem } from "../../../../../mocks/handlers";
import {
  OPERATOR_ID,
  QUALITY_API,
  REVIEW_ITEM_ID,
  REVIEW_ITEM_ID_2,
  reviewItemBody,
} from "../../../../../mocks/quality";
import { recordRequests } from "../../../../../tests/analysisDetail";
import { renderQuality } from "../../../../../tests/quality";

const ASSIGNED = reviewItemBody({ status: "ASSIGNED", assigneeId: OPERATOR_ID });
const DETAIL_PATH = `/quality/review/${REVIEW_ITEM_ID}?status=UNASSIGNED`;

function itemRequests(requests: URL[], itemId = REVIEW_ITEM_ID) {
  return requests.filter((url) => url.pathname === `/api/v1/quality/review-items/${itemId}`);
}

describe("ReviewDetail", () => {
  it("[SPEC-035 R-4] 근거 프레임·판정 결과·판정 방식·판정 이유를 보인다", async () => {
    renderQuality(DETAIL_PATH, { fixture: { reviewItems: [ASSIGNED] } });

    const frames = await screen.findByRole("region", { name: "근거 프레임" });
    expect(within(frames).getByRole("img", { name: "근거 프레임 1" })).toHaveAttribute(
      "src",
      expect.stringContaining("X-Amz-Signature"),
    );
    const result = screen.getByRole("region", { name: "판정 결과" });
    expect(result).toHaveTextContent("크레인 하부에서 작업자가 안전모 없이 자재를 옮깁니다.");
    expect(result).toHaveTextContent("안전모 미착용");
    expect(within(result).getByRole("img", { name: "심각도 높음" })).toBeVisible();
    expect(result).toHaveTextContent("확인됨");
    expect(result).toHaveTextContent("rule+vlm+escalate");
    expect(result).toHaveTextContent("judgments_disagree");
  });

  it("[SPEC-035 R-4] 서명 주소가 만료돼 이미지를 못 읽으면 상세를 한 번 다시 불러오고, 또 실패하면 안내한다", async () => {
    const recorder = recordRequests();
    renderQuality(DETAIL_PATH, { fixture: { reviewItems: [ASSIGNED] } });
    const frames = await screen.findByRole("region", { name: "근거 프레임" });
    const before = itemRequests(recorder.requests).length;

    fireEvent.error(within(frames).getByRole("img", { name: "근거 프레임 1" }));
    await expect.poll(() => itemRequests(recorder.requests).length).toBe(before + 1);

    fireEvent.error(await within(frames).findByRole("img", { name: "근거 프레임 1" }));
    expect(await within(frames).findByText("근거 프레임을 불러오지 못했습니다.")).toBeVisible();
    expect(itemRequests(recorder.requests)).toHaveLength(before + 1);
    recorder.stop();
  });

  it("[SPEC-035 R-4] 판정 결과가 없는 항목(analysis null)은 판정 없음으로 보인다", async () => {
    renderQuality(DETAIL_PATH, {
      fixture: { reviewItems: [{ ...ASSIGNED, reason: "alert_dismissed", analysis: null }] },
    });

    const result = await screen.findByRole("region", { name: "판정 결과" });
    expect(within(result).getByText("판정 없음")).toBeVisible();
    expect(result).toHaveTextContent("rule+vlm+escalate");
  });

  it("[SPEC-035 R-4] 근거 프레임이 없으면 없다고 보인다", async () => {
    renderQuality(DETAIL_PATH, {
      fixture: { reviewItems: [{ ...ASSIGNED, evidenceFrameUrls: [], evidenceFrameKeys: [] }] },
    });

    const frames = await screen.findByRole("region", { name: "근거 프레임" });
    expect(within(frames).getByText("근거 프레임 없음")).toBeVisible();
  });

  it("[SPEC-035 R-6] 저장 후 다음을 누르면 라벨을 저장하고 같은 거르기의 다음 대기 항목을 맡아 연다", async () => {
    const recorder = recordRequests();
    const { user, router } = renderQuality(DETAIL_PATH, {
      fixture: {
        reviewItems: [ASSIGNED, reviewItemBody({ itemId: REVIEW_ITEM_ID_2, eventType: "fall" })],
      },
    });
    const form = await screen.findByRole("form", { name: "라벨" });

    await user.click(within(form).getByRole("radio", { name: "틀림" }));
    await user.click(within(form).getByRole("button", { name: "저장 후 다음" }));

    await expect
      .poll(() => router.state.location.pathname)
      .toBe(`/quality/review/${REVIEW_ITEM_ID_2}`);
    expect(router.state.location.search).toContain("status=UNASSIGNED");
    expect(await screen.findByRole("region", { name: "판정 결과" })).toBeVisible();
    expect(
      recorder.requests.some((url) =>
        url.pathname.endsWith(`/review-items/${REVIEW_ITEM_ID}/label`),
      ),
    ).toBe(true);
    expect(
      recorder.requests.some((url) =>
        url.pathname.endsWith(`/review-items/${REVIEW_ITEM_ID_2}/assignment`),
      ),
    ).toBe(true);
    recorder.stop();
  });

  it("[SPEC-035 R-6] 다음 후보를 다른 운영자가 먼저 맡았으면(409) 그다음 후보를 맡는다", async () => {
    const third = "0192fa00-0000-5000-8000-000000000007";
    const { user, router } = renderQuality(DETAIL_PATH, {
      extra: [
        http.post(`${QUALITY_API}/review-items/${REVIEW_ITEM_ID_2}/assignment`, () =>
          problem(409, "QUALITY_REVIEW_ALREADY_ASSIGNED"),
        ),
      ],
      fixture: {
        reviewItems: [
          ASSIGNED,
          reviewItemBody({ itemId: REVIEW_ITEM_ID_2, createdAt: "2026-11-06T09:10:00Z" }),
          reviewItemBody({ itemId: third, createdAt: "2026-11-06T09:20:00Z" }),
        ],
      },
    });
    const form = await screen.findByRole("form", { name: "라벨" });

    await user.click(within(form).getByRole("radio", { name: "맞음" }));
    await user.click(within(form).getByRole("button", { name: "저장 후 다음" }));

    await expect.poll(() => router.state.location.pathname).toBe(`/quality/review/${third}`);
  });

  it("[SPEC-035 R-6] 다음 대기 항목이 없으면 남은 항목 없음을 보인다", async () => {
    const { user } = renderQuality(DETAIL_PATH, { fixture: { reviewItems: [ASSIGNED] } });
    const form = await screen.findByRole("form", { name: "라벨" });

    await user.click(within(form).getByRole("radio", { name: "맞음" }));
    await user.click(within(form).getByRole("button", { name: "저장 후 다음" }));

    expect(await screen.findByText("남은 항목이 없습니다.")).toBeVisible();
    expect(screen.getByRole("link", { name: "검토 큐로" })).toBeVisible();
  });

  it("[SPEC-035 R-6] 라벨 저장이 실패하면 다음 항목으로 넘어가지 않고 안내한다", async () => {
    const { user, router } = renderQuality(DETAIL_PATH, {
      extra: [
        http.put(`${QUALITY_API}/review-items/:itemId/label`, () =>
          problem(409, "QUALITY_REVIEW_NOT_ASSIGNED"),
        ),
      ],
      fixture: { reviewItems: [ASSIGNED, reviewItemBody({ itemId: REVIEW_ITEM_ID_2 })] },
    });
    const form = await screen.findByRole("form", { name: "라벨" });

    await user.click(within(form).getByRole("radio", { name: "맞음" }));
    await user.click(within(form).getByRole("button", { name: "저장 후 다음" }));

    expect(
      await screen.findByText("맡은 상태가 아닌 항목입니다. 목록에서 다시 맡아 주세요."),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe(`/quality/review/${REVIEW_ITEM_ID}`);
  });

  it("[SPEC-035 R-7] 내려놓기를 누르면 내려놓기를 요청하고 같은 거르기의 목록으로 돌아간다", async () => {
    const recorder = recordRequests();
    const { user, router } = renderQuality(DETAIL_PATH, { fixture: { reviewItems: [ASSIGNED] } });
    await screen.findByRole("form", { name: "라벨" });

    await user.click(screen.getByRole("button", { name: "내려놓기" }));

    await expect.poll(() => router.state.location.pathname).toBe("/quality/review");
    expect(router.state.location.search).toContain("status=UNASSIGNED");
    expect(await screen.findByRole("table", { name: "검토 항목" })).toBeVisible();
    expect(
      recorder.requests.some((url) =>
        url.pathname.endsWith(`/review-items/${REVIEW_ITEM_ID}/assignment`),
      ),
    ).toBe(true);
    recorder.stop();
  });

  it("[SPEC-035 R-21] 예산 초과 사유 항목 상세에는 재분석 뒤 자동 판정 안내를 보인다", async () => {
    renderQuality(DETAIL_PATH, {
      fixture: { reviewItems: [{ ...ASSIGNED, reason: "budget_exceeded" }] },
    });

    expect(await screen.findByText(/재분석 뒤 자동 판정됨/)).toBeVisible();
  });

  it("[SPEC-035 R-20] 상세가 5xx면 다시 시도 버튼을 보이고 누르면 다시 불러온다", async () => {
    let calls = 0;
    const { user } = renderQuality(DETAIL_PATH, {
      extra: [
        http.get(`${QUALITY_API}/review-items/${REVIEW_ITEM_ID}`, () => {
          calls++;
          return calls === 1 ? problem(503, "QUALITY_UNAVAILABLE") : HttpResponse.json(ASSIGNED);
        }),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("region", { name: "판정 결과" })).toBeVisible();
  });
});
