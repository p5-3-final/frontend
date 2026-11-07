import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEARCH_MOMENT_ID, SEARCH_SOURCE_ID } from "../../../../mocks/search";
import { feedbackRecorder, renderSearch, searchPath } from "../../../../tests/searchScreen";

const SOURCE_PATH = searchPath({ q: "안전모", scope: "source", sourceId: SEARCH_SOURCE_ID });

describe("FeedbackButtons", () => {
  it("[SPEC-033 R-11] 틀림을 누르면 표시가 바뀌고 기록을 한 번만 보낸다", async () => {
    const feedback = feedbackRecorder();
    const { user, stopRecording } = renderSearch(SOURCE_PATH, { extra: [feedback.handler] });
    const list = await screen.findByRole("list", { name: "검색 결과" });
    const incorrect = within(list).getByRole("button", { name: "틀림" });
    expect(incorrect).toHaveAttribute("aria-pressed", "false");

    await user.click(incorrect);
    await user.click(incorrect);

    expect(incorrect).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      expect(feedback.sent).toEqual([
        { momentId: SEARCH_MOMENT_ID, kind: "incorrect", playedMs: undefined },
      ]);
    });
    stopRecording();
  });

  it("[SPEC-033 R-11] 맞음으로 바꾸면 맞음을 한 번 더 기록하고 표시를 옮긴다", async () => {
    const feedback = feedbackRecorder();
    const { user, stopRecording } = renderSearch(SOURCE_PATH, { extra: [feedback.handler] });
    const list = await screen.findByRole("list", { name: "검색 결과" });

    await user.click(within(list).getByRole("button", { name: "틀림" }));
    await user.click(within(list).getByRole("button", { name: "맞음" }));

    expect(within(list).getByRole("button", { name: "맞음" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(list).getByRole("button", { name: "틀림" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await waitFor(() => {
      expect(feedback.sent.map((item) => item.kind)).toEqual(["incorrect", "correct"]);
    });
    stopRecording();
  });
});
