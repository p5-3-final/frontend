import { screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GOLDEN_SET_ID, REVIEW_ITEM_ID_2 } from "../../../mocks/quality";
import { renderQuality } from "../../../tests/quality";

async function tabTo(user: UserEvent, target: HTMLElement) {
  // 폼 칸 수만큼만 넘긴다. 그 안에 닿지 못하면 Tab 순서에서 빠진 것이다.
  for (let step = 0; step < 20 && document.activeElement !== target; step++) {
    await user.tab();
  }
  expect(target).toHaveFocus();
}

describe("품질 화면 키보드 조작", () => {
  it("[SPEC-035 NFR-1] 키보드만으로 맡기 → 라벨 입력 → 저장 후 다음까지 이어진다", async () => {
    const { user, router } = renderQuality("/quality/review");
    const list = await screen.findByRole("table", { name: "검토 항목" });

    within(list).getAllByRole("button", { name: "맡기" })[0]?.focus();
    await user.keyboard("{Enter}");
    const form = await screen.findByRole("form", { name: "라벨" });
    within(form).getByRole("radio", { name: "맞음" }).focus();
    await user.keyboard(" ");
    expect(within(form).getByRole("radio", { name: "맞음" })).toBeChecked();
    await tabTo(user, within(form).getByRole("button", { name: "저장 후 다음" }));
    await user.keyboard("{Enter}");

    await expect
      .poll(() => router.state.location.pathname)
      .toBe(`/quality/review/${REVIEW_ITEM_ID_2}`);
  });

  it("[SPEC-035 R-10] 버전 확정 확인 창을 키보드로 열고 취소로 닫는다", async () => {
    const { user } = renderQuality(`/quality/golden-sets/${GOLDEN_SET_ID}`);
    const freeze = await screen.findByRole("button", { name: "버전 확정" });

    freeze.focus();
    await user.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog", { name: "버전 확정" });
    // jsdom은 <dialog>의 Escape 닫기를 구현하지 않아 취소 버튼으로 확인한다. Escape는 E2E에서 확인한다.
    await tabTo(user, within(dialog).getByRole("button", { name: "취소" }));
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("dialog", { name: "버전 확정" })).not.toBeInTheDocument();
  });
});
