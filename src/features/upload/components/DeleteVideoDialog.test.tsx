import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { handlers, MEDIA_API, problem, videoBody, videoPageBody } from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

/** 영상 하나가 있는 목록. 삭제 응답을 정할 수 있고, 삭제·목록 요청 수를 센다. */
function deleteServer(deleteResponse: () => Response) {
  const counter = { deletes: 0, lists: 0 };
  let deleted = false;
  server.use(
    handlers.me(),
    http.get(MEDIA_API, () => {
      counter.lists++;
      return HttpResponse.json(
        videoPageBody(deleted ? [] : [videoBody({ id: "v1", fileName: "parking.mp4" })]),
      );
    }),
    http.delete(`${MEDIA_API}/v1`, () => {
      counter.deletes++;
      deleted = true;
      return deleteResponse();
    }),
  );
  startSession("access-1");
  return counter;
}

describe("DeleteVideoDialog", () => {
  it("[SPEC-005 R-19] 삭제를 누르면 파일 이름을 보여 주는 확인 창을 띄우고, 확인하면 지운 뒤 목록에서 뺀다", async () => {
    const counter = deleteServer(() => new HttpResponse(null, { status: 204 }));
    const { user } = renderRoute("/analysis");

    await user.click(await screen.findByRole("button", { name: "parking.mp4 삭제" }));
    const dialog = screen.getByRole("dialog", { name: "영상 삭제" });
    expect(within(dialog).getByText(/parking\.mp4/)).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "삭제" }));

    expect(await screen.findByText("올린 영상이 없습니다.")).toBeVisible();
    expect(counter.deletes).toBe(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("[SPEC-005 R-19] 확인 창에서 취소하면 아무것도 바뀌지 않는다", async () => {
    const counter = deleteServer(() => new HttpResponse(null, { status: 204 }));
    const { user } = renderRoute("/analysis");

    await user.click(await screen.findByRole("button", { name: "parking.mp4 삭제" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "영상 삭제" })).getByRole("button", {
        name: "취소",
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("parking.mp4")).toBeVisible();
    expect(counter.deletes).toBe(0);
  });

  it("[SPEC-005 R-20] 이미 없는 영상이면 안내를 보여 주고 목록을 다시 불러온다", async () => {
    const counter = deleteServer(() => problem(404, "MEDIA_VIDEO_NOT_FOUND"));
    const { user } = renderRoute("/analysis");

    await user.click(await screen.findByRole("button", { name: "parking.mp4 삭제" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "영상 삭제" })).getByRole("button", {
        name: "삭제",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "이미 삭제되었거나 찾을 수 없는 영상입니다.",
    );
    await screen.findByText("올린 영상이 없습니다.");
    expect(counter.lists).toBe(2);
  });
});
