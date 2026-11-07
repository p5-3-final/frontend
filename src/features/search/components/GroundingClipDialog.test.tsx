import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  groundingClipBody,
  momentList,
  momentSearchBody,
  SEARCH_SOURCE_ID,
  SIGNED_CLIP_URL,
} from "../../../../mocks/search";
import { renderSearch, searchPath } from "../../../../tests/searchScreen";

const RESULTS = momentList(1).map((moment) => ({
  ...moment,
  grounding: { ...moment.grounding, status: "READY" as const },
}));
const PERSON = "person without a hard hat";
const HELMET = "hard hat";

async function openClip() {
  const view = renderSearch(
    searchPath({ q: "안전모", scope: "source", sourceId: SEARCH_SOURCE_ID }),
    {
      fixture: {
        sourceSearch: momentSearchBody({ results: RESULTS }),
        // 결과 구간은 40000ms에서 시작한다. 프레임 시각은 원본 영상 기준이다.
        clip: groundingClipBody({
          targets: [PERSON, HELMET],
          colors: { [PERSON]: "#3fa2c1", [HELMET]: "#f5a524" },
          frames: [
            { ptsMs: 40000, counts: { [PERSON]: 1, [HELMET]: 0 } },
            { ptsMs: 45000, counts: { [PERSON]: 2, [HELMET]: 1 } },
          ],
        }),
      },
    },
  );
  await view.user.click(await screen.findByRole("button", { name: "주석 클립 보기" }));
  return { ...view, dialog: await screen.findByRole("dialog", { name: "주석 클립" }) };
}

describe("GroundingClipDialog", () => {
  it("[SPEC-033 R-6] 주석 클립 보기를 누르면 클립을 재생하고 대상어별 색 범례를 보인다", async () => {
    const { dialog, stopRecording } = await openClip();

    const video = within(dialog).getByLabelText<HTMLVideoElement>("주석 클립 재생");
    expect(video).toHaveAttribute("src", SIGNED_CLIP_URL);
    const legend = within(dialog).getByRole("list", { name: "대상어 색" });
    expect(within(legend).getByText(PERSON)).toBeVisible();
    expect(within(legend).getByText(HELMET)).toBeVisible();
    stopRecording();
  });

  it("[SPEC-033 R-6] 재생 위치에 가장 가까운 프레임의 대상어별 객체 수를 보인다", async () => {
    const { dialog, stopRecording } = await openClip();
    const counts = () => within(dialog).getByRole("list", { name: "프레임별 객체 수" });

    expect(within(counts()).getByText(`${PERSON}: 1`)).toBeVisible();

    const video = within(dialog).getByLabelText<HTMLVideoElement>("주석 클립 재생");
    // 클립 안 4.8초 = 원본 44800ms → 45000ms 프레임
    video.currentTime = 4.8;
    fireEvent.timeUpdate(video);

    expect(await within(counts()).findByText(`${PERSON}: 2`)).toBeVisible();
    expect(within(counts()).getByText(`${HELMET}: 1`)).toBeVisible();
    stopRecording();
  });

  it("[SPEC-033 R-6] 닫기를 누르면 창이 닫힌다", async () => {
    const { user, dialog, stopRecording } = await openClip();

    await user.click(within(dialog).getByRole("button", { name: "닫기" }));

    expect(screen.queryByRole("dialog", { name: "주석 클립" })).not.toBeInTheDocument();
    stopRecording();
  });
});
