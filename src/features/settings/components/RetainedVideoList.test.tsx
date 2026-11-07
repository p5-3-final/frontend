import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { http } from "msw";
import { handlers, problem } from "../../../../mocks/handlers";
import { RETAINED_VIDEOS_API, retainedVideoBody, retentionHandlers } from "../../../../mocks/media";
import { recordRequests } from "../../../../tests/analysisDetail";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

const FIRST = "0192f0d2-0000-7000-8000-000000000001";
const SECOND = "0192f0d2-0000-7000-8000-000000000002";
const twoRetained = [
  retainedVideoBody({ videoId: FIRST }),
  retainedVideoBody({
    videoId: SECOND,
    deletedAt: "2026-11-05T09:00:00Z",
    retainUntil: "2027-11-05T09:00:00Z",
  }),
];

function openSettings(extra: Parameters<typeof server.use> = [], retained = twoRetained) {
  server.use(...extra, handlers.me(), ...retentionHandlers({ retained }));
  startSession("access-1");
  return renderRoute("/settings");
}

async function rows() {
  const list = await screen.findByRole("list", { name: "보존 중인 삭제 영상" });
  return within(list).getAllByRole("listitem");
}

describe("RetainedVideoList", () => {
  it("[SPEC-034 R-10] 보존 중인 삭제 영상을 영상 ID·삭제 시각·보존 만료 시각과 함께 보인다", async () => {
    const recorder = recordRequests();
    openSettings();

    const [first] = await rows();
    const row = within(first ?? document.body);
    expect(row.getByText(FIRST)).toBeVisible();
    expect(row.getByText("2026. 11. 6. 오후 6:00")).toBeVisible();
    expect(row.getByText("2027. 11. 6. 오후 6:00")).toBeVisible();
    const request = recorder.requests.find(
      (url) => url.pathname === "/api/v1/media/retained-videos",
    );
    expect(request?.searchParams.get("size")).toBe("20");
    expect(screen.getByRole("navigation", { name: "쪽 이동" })).toBeVisible();
    recorder.stop();
  });

  it("[SPEC-034 R-10] 하나 철회는 확인 창 뒤에 요청하고 목록에서 뺀다", async () => {
    const { user } = openSettings();
    const [first] = await rows();

    await user.click(within(first ?? document.body).getByRole("button", { name: `${FIRST} 철회` }));
    const dialog = await screen.findByRole("dialog", { name: "학습용 보존 철회" });
    await user.click(within(dialog).getByRole("button", { name: "철회" }));

    await screen.findByText(SECOND);
    expect(screen.queryByText(FIRST)).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("[SPEC-034 R-10] 확인 창에서 취소하면 철회하지 않는다", async () => {
    const { user } = openSettings();
    const [first] = await rows();

    await user.click(within(first ?? document.body).getByRole("button", { name: `${FIRST} 철회` }));
    await user.click(await screen.findByRole("button", { name: "취소" }));

    expect(screen.getByText(FIRST)).toBeVisible();
  });

  it("[SPEC-034 R-10] 전체 철회를 확인하면 목록이 빈다", async () => {
    const { user } = openSettings();
    await rows();

    await user.click(screen.getByRole("button", { name: "전체 철회" }));
    const dialog = await screen.findByRole("dialog", { name: "학습용 보존 전체 철회" });
    expect(within(dialog).getByText(/보존 중인 영상 2개/)).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "전체 철회" }));

    expect(await screen.findByText("보존 중인 삭제 영상이 없습니다.")).toBeVisible();
  });

  it("[SPEC-034 R-10] 이미 없는 영상(404)이면 안내하고 목록을 다시 읽는다", async () => {
    // 목록을 읽은 뒤 FIRST의 보존이 만료됐다.
    const { user } = openSettings([
      http.delete(`${RETAINED_VIDEOS_API}/:videoId`, () =>
        problem(404, "MEDIA_RETAINED_VIDEO_NOT_FOUND"),
      ),
    ]);
    const [first] = await rows();

    await user.click(within(first ?? document.body).getByRole("button", { name: `${FIRST} 철회` }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "철회" }),
    );

    expect(await screen.findByText("이미 철회했거나 보존 기간이 끝난 영상입니다.")).toBeVisible();
  });
});
