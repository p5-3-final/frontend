import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  handlers,
  MEDIA_API,
  mediaHandlers,
  videoBody,
  videoPageBody,
} from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";
import { addFiles } from "../model/uploadQueue";
import type { Video } from "../model/schemas";

/** 페이지 번호마다 정한 목록을 돌려주고, 요청한 page·size를 기록한다. */
function listServer(pages: Video[][], totalElements: number) {
  const requested: string[] = [];
  server.use(
    handlers.me(),
    http.get(MEDIA_API, ({ request }) => {
      const url = new URL(request.url);
      requested.push(`${url.searchParams.get("page") ?? ""}/${url.searchParams.get("size") ?? ""}`);
      const page = Number(url.searchParams.get("page"));
      return HttpResponse.json(videoPageBody(pages[page] ?? [], page, totalElements));
    }),
  );
  startSession("access-1");
  return requested;
}

async function listRows() {
  const list = await screen.findByRole("list", { name: "내 영상" });
  return within(list).getAllByRole("listitem");
}

describe("VideoList", () => {
  it("[SPEC-005 R-15] 내 영상을 파일 이름, 크기, 상태, 올린 시각과 함께 보여 준다", async () => {
    const requested = listServer(
      [
        [
          videoBody({
            id: "v1",
            fileName: "parking.mp4",
            sizeBytes: 110_000_000,
            status: "UPLOADED",
            createdAt: "2026-11-03T00:00:00Z",
          }),
        ],
      ],
      1,
    );
    renderRoute("/analysis");

    const [row] = await listRows();
    const cell = within(row ?? document.body);
    expect(cell.getByText("parking.mp4")).toBeVisible();
    expect(cell.getByText("104.9 MB")).toBeVisible();
    expect(cell.getByText("업로드 완료")).toBeVisible();
    expect(cell.getByText("2026. 11. 3. 오전 9:00")).toBeVisible();
    expect(requested).toEqual(["0/20"]);
  });

  it("[SPEC-006 R-6] 영상 이름을 누르면 그 영상의 상세 화면으로 이동한다", async () => {
    const id = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";
    // 나중에 등록한 핸들러가 먼저 적용되므로 목록 핸들러(listServer)를 마지막에 등록한다.
    server.use(
      http.get(`${MEDIA_API}/:id`, () =>
        HttpResponse.json(videoBody({ id, fileName: "parking.mp4", status: "UPLOADED" })),
      ),
      ...mediaHandlers(),
    );
    listServer([[videoBody({ id, fileName: "parking.mp4", status: "UPLOADED" })]], 1);
    const { user, router } = renderRoute("/analysis");

    await user.click(await screen.findByRole("link", { name: "parking.mp4" }));

    // 상세 화면은 lazy로 불러오므로 화면이 바뀐 뒤 주소를 확인한다.
    expect(await screen.findByRole("heading", { name: "parking.mp4" })).toBeVisible();
    expect(router.state.location.pathname).toBe(`/analysis/videos/${id}`);
  });

  it("[SPEC-005 R-15] 20개를 넘으면 다음 쪽으로 넘겨 다음 영상들을 본다", async () => {
    const first = Array.from({ length: 20 }, (_, i) =>
      videoBody({ id: `v${String(i)}`, fileName: `v${String(i)}.mp4` }),
    );
    const requested = listServer([first, [videoBody({ id: "v20", fileName: "v20.mp4" })]], 21);
    const { user, router } = renderRoute("/analysis");

    expect(await listRows()).toHaveLength(20);
    expect(screen.getByText("1 / 2쪽")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "다음 쪽" }));

    expect(await screen.findByText("v20.mp4")).toBeVisible();
    expect(screen.getByText("2 / 2쪽")).toBeVisible();
    expect(screen.getByRole("button", { name: "다음 쪽" })).toBeDisabled();
    expect(router.state.location.search).toBe("?page=1");
    expect(requested).toEqual(["0/20", "1/20"]);
  });

  it.each([
    ["UPLOADING", "업로드 중"],
    ["UPLOADED", "업로드 완료"],
    ["EXPIRED", "만료됨"],
    ["NORMALIZING", "변환 중"],
    ["READY", "분석 준비됨"],
    ["REJECTED", "처리 불가"],
  ] as const)("[SPEC-005 R-16] 상태 %s의 이름은 %s다", async (status, name) => {
    listServer([[videoBody({ status })]], 1);
    renderRoute("/analysis");

    const [row] = await listRows();
    expect(within(row ?? document.body).getByText(name)).toBeVisible();
  });

  it("[SPEC-005 R-17] 올리고 있지 않은 업로드 중 영상에는 끝나지 않았고 24시간 뒤 만료된다고 알린다", async () => {
    listServer([[videoBody({ id: "old", status: "UPLOADING" })]], 1);
    renderRoute("/analysis");

    const [row] = await listRows();
    expect(
      within(row ?? document.body).getByText(
        "업로드가 끝나지 않았습니다. 24시간이 지나면 만료됩니다.",
      ),
    ).toBeVisible();
  });

  it("[SPEC-005 R-17] 지금 올리고 있는 영상에는 미완료 안내를 보여 주지 않는다", async () => {
    server.use(...mediaHandlers({ storageGate: new Promise(() => {}) }));
    listServer([[videoBody({ id: "a.mp4", fileName: "a.mp4", status: "UPLOADING" })]], 1);
    addFiles([new File([new Uint8Array(10)], "a.mp4")]);
    renderRoute("/analysis");

    const [row] = await listRows();
    expect(within(row ?? document.body).getByText("업로드 중")).toBeVisible();
    expect(
      screen.queryByText("업로드가 끝나지 않았습니다. 24시간이 지나면 만료됩니다."),
    ).not.toBeInTheDocument();
  });
});
