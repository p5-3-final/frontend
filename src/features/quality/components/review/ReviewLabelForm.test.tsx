import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  OPERATOR_ID,
  OTHER_OPERATOR_ID,
  REVIEW_ITEM_ID,
  reviewItemBody,
} from "../../../../../mocks/quality";
import { renderQuality } from "../../../../../tests/quality";

const PATH = `/quality/review/${REVIEW_ITEM_ID}`;

describe("ReviewLabelForm", () => {
  it("[SPEC-035 R-5] 다른 운영자가 맡은 항목은 라벨 입력이 막혀 있다", async () => {
    renderQuality(PATH, {
      fixture: {
        reviewItems: [reviewItemBody({ status: "ASSIGNED", assigneeId: OTHER_OPERATOR_ID })],
      },
    });

    const form = await screen.findByRole("form", { name: "라벨" });
    expect(within(form).getByRole("radio", { name: "맞음" })).toBeDisabled();
    expect(within(form).getByLabelText("메모")).toBeDisabled();
    expect(within(form).queryByRole("button", { name: "저장 후 다음" })).not.toBeInTheDocument();
  });

  it("[SPEC-035 R-5] 맡은 사람에게는 판정 결과 유형·구간을 미리 채워 입력을 연다", async () => {
    renderQuality(PATH, {
      fixture: { reviewItems: [reviewItemBody({ status: "ASSIGNED", assigneeId: OPERATOR_ID })] },
    });

    const form = await screen.findByRole("form", { name: "라벨" });
    expect(within(form).getByRole("radio", { name: "맞음" })).toBeEnabled();
    expect(within(form).getByLabelText("이벤트 유형")).toHaveValue("ppe_missing");
    expect(within(form).getByLabelText("시작(초)")).toHaveValue(95);
    expect(within(form).getByLabelText("끝(초)")).toHaveValue(105);
  });

  it("[SPEC-035 R-5] 이벤트 있음인데 구간이 비면 저장 버튼이 막히고 이유를 보인다", async () => {
    const { user } = renderQuality(PATH, {
      fixture: { reviewItems: [reviewItemBody({ status: "ASSIGNED", assigneeId: OPERATOR_ID })] },
    });
    const form = await screen.findByRole("form", { name: "라벨" });

    await user.click(within(form).getByRole("radio", { name: "맞음" }));
    await user.clear(within(form).getByLabelText("끝(초)"));

    expect(within(form).getByRole("button", { name: "저장 후 다음" })).toBeDisabled();
    expect(within(form).getByText("이벤트 구간의 시작·끝 시각을 넣어 주세요.")).toBeVisible();
  });

  it("[SPEC-035 R-5] 끝이 시작보다 앞이면 저장 버튼이 막힌다", async () => {
    const { user } = renderQuality(PATH, {
      fixture: { reviewItems: [reviewItemBody({ status: "ASSIGNED", assigneeId: OPERATOR_ID })] },
    });
    const form = await screen.findByRole("form", { name: "라벨" });

    await user.click(within(form).getByRole("radio", { name: "맞음" }));
    await user.clear(within(form).getByLabelText("끝(초)"));
    await user.type(within(form).getByLabelText("끝(초)"), "90");

    expect(within(form).getByRole("button", { name: "저장 후 다음" })).toBeDisabled();
    expect(within(form).getByText("끝 시각은 시작 시각보다 뒤여야 합니다.")).toBeVisible();
  });

  it("[SPEC-035 R-5] 이벤트 있음을 끄면 유형을 비우고 고를 수 없게 한다", async () => {
    const { user } = renderQuality(PATH, {
      fixture: { reviewItems: [reviewItemBody({ status: "ASSIGNED", assigneeId: OPERATOR_ID })] },
    });
    const form = await screen.findByRole("form", { name: "라벨" });

    await user.click(within(form).getByRole("checkbox", { name: "이벤트 있음" }));

    expect(within(form).getByLabelText("이벤트 유형")).toHaveValue("");
    expect(within(form).getByLabelText("이벤트 유형")).toBeDisabled();
  });

  it("[SPEC-035 R-5] 라벨된 항목은 저장된 라벨을 읽기 전용으로 보인다", async () => {
    renderQuality(PATH, {
      fixture: {
        reviewItems: [
          reviewItemBody({
            status: "LABELED",
            assigneeId: OPERATOR_ID,
            label: {
              verdict: "incorrect",
              eventPresent: true,
              eventType: "ppe_missing",
              startMs: 96000,
              endMs: 104000,
              severity: "medium",
              note: "조끼만 없음",
            },
          }),
        ],
      },
    });

    const form = await screen.findByRole("form", { name: "라벨" });
    expect(within(form).getByRole("radio", { name: "틀림" })).toBeChecked();
    expect(within(form).getByRole("radio", { name: "틀림" })).toBeDisabled();
    expect(within(form).getByLabelText("메모")).toHaveValue("조끼만 없음");
  });
});
